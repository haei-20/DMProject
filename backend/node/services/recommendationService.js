const FPGrowth = require("node-fpgrowth");
const apriori = require("apriori");
const NodeCache = require("node-cache");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Cache kết quả để tránh tính toán lại mỗi lần gọi API
const cache = new NodeCache({ stdTTL: 600 }); // Cache trong 10 phút

// Lấy danh sách giao dịch từ MongoDB
const getTransactions = async (limit = 0) => {
  try {
    console.log(`Bắt đầu lấy dữ liệu đơn hàng từ database (limit=${limit})...`);
    
    // OPTIMIZATION: Sử dụng projection để chỉ lấy các trường cần thiết, giảm dữ liệu truyền qua mạng
    // Chỉ cần orderItems và _id, không cần những trường khác của đơn hàng
    const projection = { 'orderItems.product': 1, 'orderItems.qty': 1, '_id': 1 };
    
    // Lấy đơn hàng từ database với projection tối ưu
    let orders;
    if (limit > 0) {
      orders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select(projection)
        .lean();
    } else {
      orders = await Order.find({})
        .select(projection)
        .lean();
    }
    
    console.log(`Đã lấy ${orders.length} đơn hàng từ database`);
    
    // Debug log ngắn gọn hơn
    if (orders.length > 0) {
      console.log(`Đơn hàng đầu tiên có ${orders[0].orderItems?.length || 0} sản phẩm`);
    }
    
    // OPTIMIZATION: Xử lý transactions trong một lần duyệt, giảm thời gian xử lý
    let transactions = [];
    let invalidOrderCount = 0;
    
    // Tối ưu việc chuyển đổi đơn hàng thành giao dịch
    for (const order of orders) {
      // Kiểm tra và xử lý orderItems hiệu quả hơn
      if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
        // Xử lý productId trực tiếp, chỉ thêm mỗi sản phẩm một lần (không quan tâm số lượng)
        // Điều này giúp giảm kích thước giao dịch và tăng tốc độ thuật toán
        const productIds = new Set();
        
        for (const item of order.orderItems) {
          if (item && item.product) {
            const productId = typeof item.product === 'object' && item.product._id 
              ? item.product._id.toString() 
              : item.product.toString();
            
            // Thêm mỗi ID sản phẩm duy nhất một lần
            productIds.add(productId);
          }
        }
        
        // Chuyển Set thành Array
        const uniqueProductIds = [...productIds];
        
        // Chỉ thêm vào transactions nếu có ít nhất 2 sản phẩm khác nhau
        // Điều này giúp giảm số lượng giao dịch không có ý nghĩa
        if (uniqueProductIds.length >= 2) {
          transactions.push(uniqueProductIds);
        }
      } else {
        invalidOrderCount++;
      }
    }
    
    console.log(`Đã tạo ${transactions.length} giao dịch hợp lệ từ ${orders.length} đơn hàng (${invalidOrderCount} đơn hàng không hợp lệ)`);
    
    // OPTIMIZATION: Kiểm tra số lượng giao dịch sớm để tránh xử lý không cần thiết
    if (transactions.length < 10) {
      console.log("CẢNH BÁO: Số lượng giao dịch thấp (<10), kết quả có thể không đáng tin cậy");
      
      // Nếu giao dịch quá ít (< 5), tạo dữ liệu mẫu từ sản phẩm thực
      if (transactions.length < 5) {
        console.log("Số lượng giao dịch quá ít, tạo dữ liệu mẫu từ sản phẩm thực");
        
        // Lấy tất cả sản phẩm từ cơ sở dữ liệu, chỉ lấy _id để tối ưu hiệu suất
        const allProducts = await Product.find({}).select('_id').lean();
        
        if (allProducts.length === 0) {
          console.log("Không có sản phẩm nào trong database để tạo dữ liệu mẫu");
          return [];
        }
        
        console.log(`Tìm thấy ${allProducts.length} sản phẩm để tạo dữ liệu mẫu`);
        
        // Lấy ID của tất cả sản phẩm
        const productIds = allProducts.map(product => product._id.toString());
        
        // Tạo các giao dịch mẫu với số lượng phù hợp
        const sampleTransactions = [];
        const numTransactions = Math.min(50, Math.max(20, productIds.length / 2));
        
        for (let i = 0; i < numTransactions; i++) {
          // Mỗi giao dịch chứa 2-5 sản phẩm ngẫu nhiên (ít nhất 2 sản phẩm)
          const numProducts = Math.floor(Math.random() * 4) + 2; // 2-5 sản phẩm
          
          // Chọn sản phẩm ngẫu nhiên không trùng lặp
          const shuffled = [...productIds].sort(() => 0.5 - Math.random());
          const selectedProducts = shuffled.slice(0, numProducts);
          
          sampleTransactions.push(selectedProducts);
        }
        
        console.log(`Đã tạo ${sampleTransactions.length} giao dịch mẫu từ sản phẩm thực`);
        return sampleTransactions;
      }
    }
    
    return transactions;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu đơn hàng:", error);
    return [];
  }
};

// Tự động chọn minSupport dựa vào số lượng giao dịch
const getDynamicMinSupport = (numTransactions) => {
  if (numTransactions < 50) return 0.05; // Dữ liệu ít -> giảm minSupport
  if (numTransactions < 500) return 0.1;
  return 0.2; // Dữ liệu nhiều -> tăng minSupport để giảm noise
};

// Thuật toán Apriori đơn giản hóa để tìm cặp sản phẩm thường mua cùng nhau
const getAprioriRecommendations = async () => {
  const cachedData = cache.get("apriori");
  if (cachedData) return cachedData;

  try {
    const transactions = await getTransactions();
    
    if (!transactions || transactions.length < 2) {
      console.log("Không đủ dữ liệu giao dịch cho Apriori");
      return [];
    }

    // Tính toán minSupport - giảm xuống để có nhiều cặp sản phẩm hơn
    const minSupport = Math.max(1 / transactions.length, 0.01); // Tối thiểu 1 giao dịch hoặc 1%
    const minConfidence = 0.1; // Giảm xuống 10% để có nhiều rules hơn

    console.log(`Chạy Apriori với minSupport=${minSupport}, minConfidence=${minConfidence}`);
    console.log(`Số lượng giao dịch: ${transactions.length}`);

    // Tạo các cặp sản phẩm từ giao dịch
    const pairs = new Map(); // Lưu trữ các cặp sản phẩm và số lần xuất hiện
    const productCount = new Map(); // Lưu trữ số lần xuất hiện của từng sản phẩm

    // Đếm số lần xuất hiện của từng sản phẩm và các cặp sản phẩm
    transactions.forEach(transaction => {
      // Đếm số lần xuất hiện của từng sản phẩm
      transaction.forEach(productId => {
        productCount.set(productId, (productCount.get(productId) || 0) + 1);
      });

      // Tạo các cặp sản phẩm
      for (let i = 0; i < transaction.length; i++) {
        for (let j = i + 1; j < transaction.length; j++) {
          const pair = [transaction[i], transaction[j]].sort().join('_');
          pairs.set(pair, (pairs.get(pair) || 0) + 1);
        }
      }
    });

    // Tạo rules từ các cặp sản phẩm
    const rules = [];
    pairs.forEach((count, pair) => {
      const [product1, product2] = pair.split('_');
      const support = count / transactions.length;

      if (support >= minSupport) {
        // Tính confidence cho cả hai chiều
        const confidence1 = count / productCount.get(product1);
        const confidence2 = count / productCount.get(product2);

        if (confidence1 >= minConfidence) {
          rules.push({
            antecedent: product1,
            consequent: product2,
            support: support,
            confidence: confidence1
          });
        }

        if (confidence2 >= minConfidence) {
          rules.push({
            antecedent: product2,
            consequent: product1,
            support: support,
            confidence: confidence2
          });
        }
      }
    });

    // Sắp xếp rules theo confidence và support
    rules.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.support - a.support;
    });

    console.log(`Tìm thấy ${rules.length} luật kết hợp`);
    
    // Log một số rules đầu tiên để kiểm tra
    if (rules.length > 0) {
      console.log("Ví dụ các luật kết hợp:");
      rules.slice(0, 3).forEach((rule, i) => {
        console.log(`Rule ${i + 1}: ${rule.antecedent} -> ${rule.consequent} (conf: ${rule.confidence.toFixed(2)}, sup: ${rule.support.toFixed(2)})`);
      });
    }
    
    cache.set("apriori", rules);
    return rules;
  } catch (error) {
    console.error("Lỗi khi chạy thuật toán Apriori:", error);
    return [];
  }
};

// Thuật toán FP-Growth với minSupport động
const getFPGrowthRecommendations = async () => {
  const cachedData = cache.get("fp-growth");
  if (cachedData) return cachedData;

  const transactions = await getTransactions();
  const minSupport = getDynamicMinSupport(transactions.length);
  const fpgrowth = new FPGrowth.FPGrowth(minSupport);

  return new Promise(resolve => {
    fpgrowth.exec(transactions).then(results => {
      const frequentPatterns = results
        .filter(pattern => pattern.items.length > 1)
        .map(pattern => ({
          items: pattern.items,
          support: pattern.support
        }));
      
      cache.set("fp-growth", frequentPatterns);
      resolve(frequentPatterns);
    });
  });
};

// Lấy đề xuất sản phẩm cho giỏ hàng dựa trên các sản phẩm đang có trong giỏ
const getCartRecommendations = async (cartItems, limit = 4) => {
  try {
    console.log("DEBUG: cartItems count:", cartItems.length);
    cartItems.slice(0, 3).forEach((item, idx) => {
      console.log(`DEBUG: cartItems[${idx}]:`, {
        hasProduct: !!item.product,
        productType: typeof item.product,
        productIsNull: item.product === null,
        quantity: item.quantity
      });
    });
    
    // Lấy IDs của sản phẩm trong giỏ hàng - LỌC NULL TRƯỚC
    const cartProductIds = cartItems
      .filter(item => item.product !== null && item.product !== undefined)
      .map(item => {
        // Đảm bảo lấy được id dù product là object hay string
        if (typeof item.product === 'object' && item.product._id) {
          return item.product._id.toString();
        }
        return item.product.toString();
      }).filter(id => id); // Loại bỏ các ID không hợp lệ
    
    console.log("Cart product IDs:", cartProductIds);
    
    if (cartProductIds.length === 0) {
      // Nếu giỏ hàng trống, trả về sản phẩm nổi bật
      console.log("Giỏ hàng trống, đề xuất sản phẩm nổi bật");
      const featuredProducts = await Product.find({ featured: true })
        .limit(limit)
        .select('_id name price image rating numReviews');
      return featuredProducts;
    }
    
    // Lấy luật kết hợp từ thuật toán Apriori
    const rules = await getAprioriRecommendations();
    console.log(`Đã lấy ${rules.length} luật kết hợp từ Apriori`);
    
    // Tìm các luật có chứa ít nhất một sản phẩm trong giỏ hàng
    // Rules có cấu trúc: { antecedent, consequent, support, confidence }
    const relevantRules = rules.filter(rule => 
      (rule.antecedent && cartProductIds.includes(rule.antecedent.toString())) ||
      (rule.consequent && cartProductIds.includes(rule.consequent.toString()))
    );
    
    console.log(`Tìm thấy ${relevantRules.length} luật liên quan đến sản phẩm trong giỏ hàng`);
    
    // Lấy các sản phẩm được đề xuất (loại bỏ các sản phẩm đã có trong giỏ hàng)
    let recommendedProductIds = new Set();
    
    relevantRules.forEach(rule => {
      // Nếu antecedent có trong giỏ, gợi ý consequent
      if (rule.antecedent && cartProductIds.includes(rule.antecedent.toString())) {
        if (rule.consequent && !cartProductIds.includes(rule.consequent.toString())) {
          recommendedProductIds.add(rule.consequent.toString());
        }
      }
      // Nếu consequent có trong giỏ, gợi ý antecedent
      if (rule.consequent && cartProductIds.includes(rule.consequent.toString())) {
        if (rule.antecedent && !cartProductIds.includes(rule.antecedent.toString())) {
          recommendedProductIds.add(rule.antecedent.toString());
        }
      }
    });
    
    // Chuyển Set thành Array và giới hạn số lượng
    recommendedProductIds = [...recommendedProductIds].slice(0, limit);
    
    console.log(`Các ID sản phẩm được đề xuất: ${recommendedProductIds.join(', ')}`);
    
    // Nếu không có sản phẩm đề xuất từ luật kết hợp, trả về sản phẩm nổi bật
    if (recommendedProductIds.length === 0) {
      console.log("Không tìm thấy đề xuất từ luật kết hợp, trả về sản phẩm nổi bật");
      const featuredProducts = await Product.find({ 
        featured: true,
        _id: { $nin: cartProductIds }
      })
      .limit(limit)
      .select('_id name price image rating numReviews');
      return featuredProducts;
    }
    
    // Lấy thông tin chi tiết sản phẩm
    const recommendedProducts = await Product.find({ 
      _id: { $in: recommendedProductIds } 
    }).select('_id name price image rating numReviews');
    
    console.log(`Tìm thấy ${recommendedProducts.length} sản phẩm đề xuất`);
    
    // Nếu không đủ sản phẩm đề xuất, bổ sung thêm sản phẩm nổi bật
    if (recommendedProducts.length < limit) {
      const additionalCount = limit - recommendedProducts.length;
      const existingIds = recommendedProducts.map(p => p._id.toString());
      
      console.log(`Bổ sung thêm ${additionalCount} sản phẩm nổi bật`);
      
      const additionalProducts = await Product.find({ 
        _id: { $nin: [...cartProductIds, ...existingIds] },
        featured: true
      })
      .limit(additionalCount)
      .select('_id name price image rating numReviews');
      
      return [...recommendedProducts, ...additionalProducts];
    }
    
    return recommendedProducts;
  } catch (error) {
    console.error("Lỗi khi tạo đề xuất giỏ hàng:", error);
    
    // Nếu lỗi, trả về một số sản phẩm nổi bật
    try {
      console.log("Trả về sản phẩm nổi bật do có lỗi trong quá trình đề xuất");
      const fallbackProducts = await Product.find({ featured: true })
        .limit(limit)
        .select('_id name price image rating numReviews');
      return fallbackProducts;
    } catch (fallbackError) {
      console.error("Lỗi khi lấy sản phẩm nổi bật:", fallbackError);
      return [];
    }
  }
};

// Lấy đề xuất sản phẩm cho trang chủ
const getHomepageRecommendations = async (userId = null, limit = 8) => {
  try {
    // Nếu có userId, tìm đề xuất cá nhân hóa
    if (userId) {
      // Lấy các sản phẩm mà người dùng đã mua
      const userOrders = await Order.find({ user: userId }, 'items.product');
      const userProducts = userOrders.flatMap(order => 
        order.items.map(item => item.product.toString())
      );
      
      if (userProducts.length > 0) {
        // Lấy các luật kết hợp từ FP-Growth (thường tốt hơn cho đề xuất cá nhân hóa)
        const rules = await getFPGrowthRecommendations();
        
        // Tìm các luật có chứa sản phẩm mà người dùng đã mua
        const relevantRules = rules.filter(rule => 
          rule.items.some(item => userProducts.includes(item))
        );
        
        // Lấy các sản phẩm được đề xuất (loại bỏ các sản phẩm đã mua)
        let recommendedProductIds = new Set();
        
        relevantRules.forEach(rule => {
          rule.items.forEach(item => {
            if (!userProducts.includes(item)) {
              recommendedProductIds.add(item);
            }
          });
        });
        
        // Chuyển Set thành Array và giới hạn số lượng
        recommendedProductIds = [...recommendedProductIds].slice(0, limit);
        
        if (recommendedProductIds.length > 0) {
          // Lấy thông tin chi tiết sản phẩm
          const recommendedProducts = await Product.find({ 
            _id: { $in: recommendedProductIds } 
          }).select('_id name price images rating numReviews description');
          
          // Nếu không đủ sản phẩm đề xuất, bổ sung thêm sản phẩm nổi bật
          if (recommendedProducts.length < limit) {
            const additionalCount = limit - recommendedProducts.length;
            const existingIds = recommendedProducts.map(p => p._id.toString());
            
            const additionalProducts = await Product.find({ 
              _id: { $nin: [...userProducts, ...existingIds] },
              isFeatured: true
            })
            .limit(additionalCount)
            .select('_id name price images rating numReviews description');
            
            return [...recommendedProducts, ...additionalProducts];
          }
          
          return recommendedProducts;
        }
      }
    }
    
    // Nếu không có userId hoặc không có đề xuất cá nhân hóa, trả về sản phẩm nổi bật
    return await Product.find({ isFeatured: true })
      .limit(limit)
      .select('_id name price images rating numReviews description');
  } catch (error) {
    console.error("Lỗi khi tạo đề xuất trang chủ:", error);
    return [];
  }
};

// Lấy đề xuất sản phẩm thường được mua cùng nhau cho admin (để tạo combo)
const getFrequentlyBoughtTogether = async (minSupport = 0.01, limit = 50, orderLimit = 1000) => {
  try {
    // Tạo key cho cache dựa vào tham số đầu vào
    const cacheKey = `frequently-bought-together-${minSupport}-${limit}-${orderLimit}`;
    
    // Kiểm tra cache trước khi tính toán
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log("Trả về kết quả từ cache");
      return cachedResult;
    }
    
    console.log(`Phân tích dữ liệu với minSupport=${minSupport}, limit=${limit}, orderLimit=${orderLimit}`);
    
    // Lấy dữ liệu giao dịch từ database với giới hạn số đơn hàng
    const transactions = await getTransactions(orderLimit);
    
    // Chi tiết debug
    console.log(`DEBUG: Số lượng giao dịch: ${transactions.length}`);
    if (transactions.length > 0) {
      console.log(`DEBUG: Giao dịch đầu tiên:`, JSON.stringify(transactions[0]));
    }
    
    // Chỉ kiểm tra nếu không có giao dịch nào
    if (!transactions || transactions.length === 0) {
      console.log("Không có dữ liệu giao dịch nào");
      return {
        frequentItemsets: [],
        message: "Không có dữ liệu giao dịch nào để phân tích",
        success: false
      };
    }
    
    // Sử dụng giá trị cố định cho minSupport để đảm bảo hiệu năng
    const adjustedMinSupport = 0.01;
    
    console.log(`Using minSupport: ${adjustedMinSupport}`);

    // OPTIMIZATION: Lọc các giao dịch quá lớn có thể gây chậm thuật toán
    const MAX_TRANSACTION_SIZE = 20; // Giới hạn số lượng sản phẩm tối đa trong 1 giao dịch
    
    // Đảm bảo rằng transactions là một mảng các mảng chuỗi (required by FPGrowth) và có kích thước hợp lý
    const validTransactions = transactions.filter(trans => {
      return Array.isArray(trans) && trans.length > 0 && trans.length <= MAX_TRANSACTION_SIZE;
    }).map(trans => {
      // Chuyển đổi tất cả ID thành chuỗi và loại bỏ các ID trùng lặp
      return [...new Set(trans.map(item => String(item)))];
    });
    
    console.log(`Filtered valid transactions: ${validTransactions.length}`);
    
    try {
      // OPTIMIZATION: Kiểm tra số lượng giao dịch trước khi chạy thuật toán
      if (validTransactions.length < 10) {
        console.log("Số lượng giao dịch quá ít, không chạy FP-Growth");
        return {
          frequentItemsets: [],
          message: "Số lượng giao dịch quá ít để phân tích (cần ít nhất 10 giao dịch)",
          success: false
        };
      }
      
      // Sử dụng FP-Growth với minSupport cố định
      const fpgrowth = new FPGrowth.FPGrowth(adjustedMinSupport);
      
      const startTime = Date.now();
      
      console.log("Bắt đầu chạy thuật toán FP-Growth...");
      
      // OPTIMIZATION: Thiết lập timeout để tránh chạy quá lâu
      const TIMEOUT_MS = 30000; // 30 giây
      
      let results;
      try {
        // Wrap FP-Growth execution in a promise with timeout
        const fpGrowthPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("FP-Growth execution timed out after 30 seconds"));
          }, TIMEOUT_MS);
          
          fpgrowth.exec(validTransactions)
            .then(results => {
              clearTimeout(timeout);
              resolve(results);
            })
            .catch(err => {
              clearTimeout(timeout);
              reject(err);
            });
        });
        
        results = await fpGrowthPromise;
      } catch (fpError) {
        console.error("Lỗi khi chạy thuật toán FP-Growth:", fpError.message);
        console.log("Chuyển sang sử dụng thuật toán Apriori làm phương án dự phòng...");
        
        // FALLBACK: Sử dụng thuật toán Apriori khi FP-Growth thất bại
        const minSupport = Math.max(1 / validTransactions.length, adjustedMinSupport);
        const minConfidence = 0.1;
        
        try {
          // Chạy Apriori với tập dữ liệu
          const aprioriResults = apriori.exec(validTransactions, minSupport, minConfidence);
          
          if (!aprioriResults || !aprioriResults.itemsets) {
            throw new Error("Apriori không trả về kết quả hợp lệ");
          }
          
          // Biến đổi kết quả từ Apriori sang cùng định dạng với FP-Growth
          results = aprioriResults.itemsets
            .filter(itemset => itemset.items.length >= 2)
            .map(itemset => ({
              items: itemset.items,
              support: itemset.support
            }));
          
          console.log(`Apriori thành công, tìm thấy ${results.length} mẫu.`);
        } catch (aprioriError) {
          console.error("Cả hai thuật toán FP-Growth và Apriori đều thất bại:", aprioriError);
          return {
            frequentItemsets: [],
            message: "Lỗi phân tích dữ liệu, vui lòng thử lại với tham số khác.",
            success: false,
            error: fpError.message + "; " + aprioriError.message
          };
        }
      }
      
      const endTime = Date.now();
      
      console.log(`Phân tích xong trong ${(endTime-startTime)/1000}s. Tìm thấy ${results.length} mẫu.`);
      console.log(`DEBUG: Kết quả đầu tiên:`, results.length > 0 ? JSON.stringify(results[0]) : "Không có kết quả");
      
      // Lọc các pattern có từ 2 sản phẩm trở lên và sắp xếp theo support giảm dần
      const frequentPatterns = results
        .filter(pattern => pattern.items.length >= 2)
        .map(pattern => {
          // IMPORTANT FIX: Kiểm tra nếu support là số nguyên (>1) thì đó là frequency chứ không phải support
          // Support phải nằm trong khoảng 0-1
          const supportIsCount = typeof pattern.support === 'number' && pattern.support > 1;
          
          // Nếu support thực sự là số lần xuất hiện, tính lại support đúng
          const actualFrequency = supportIsCount ? pattern.support : Math.round(pattern.support * validTransactions.length);
          
          return {
            ...pattern,
            // Lưu trữ frequency thật
            actualFrequency: actualFrequency,
            // Giữ nguyên support gốc để debug
            rawSupport: pattern.support
          };
        })
        .sort((a, b) => b.actualFrequency - a.actualFrequency)
        .slice(0, limit);
      
      console.log(`Đã lọc ${frequentPatterns.length} mẫu phù hợp.`);
      
      // Nếu không có pattern nào, trả về kết quả trống với thông báo rõ ràng
      if (frequentPatterns.length === 0) {
        console.log("Không tìm thấy mẫu mua hàng nào thỏa mãn điều kiện");
        return {
          frequentItemsets: [],
          message: "Không tìm thấy mẫu mua hàng nào thỏa mãn điều kiện. Thử giảm minSupport hoặc thêm dữ liệu.",
          success: false
        };
      }
      
      // Lấy số lượng đơn hàng thực tế để tính tỷ lệ chính xác
      const totalOrders = await Order.countDocuments();
      console.log(`Tổng số đơn hàng trong database: ${totalOrders}`);
      
      // Số lượng giao dịch hợp lệ sử dụng trong thuật toán
      const validTransactionCount = validTransactions.length;
      console.log(`Số giao dịch hợp lệ đưa vào thuật toán: ${validTransactionCount}`);
      
      // OPTIMIZATION: Xử lý bất đồng bộ cho chi tiết sản phẩm để cải thiện hiệu suất
      const patternDetails = await Promise.all(
        frequentPatterns.map(async pattern => {
          try {
            // Lấy thông tin sản phẩm - chỉ lấy các trường cần thiết
            const products = await Product.find({ 
              _id: { $in: pattern.items } 
            }).select('_id name price image category').lean();
            
            // Nếu không tìm được đủ sản phẩm, bỏ qua pattern này
            if (products.length !== pattern.items.length) {
              console.log(`Không tìm thấy đủ thông tin sản phẩm cho pattern: ${pattern.items.join(', ')}`);
              return null;
            }
            
            // Sử dụng frequency đã tính ở trên
            const frequency = pattern.actualFrequency;
            
            // FIX: Tính support chính xác từ frequency
            // Support phải dưới 1.0 (100%) và đại diện cho tỷ lệ xuất hiện thực tế
            const actualSupport = frequency / validTransactionCount;
            
            // Debug log để kiểm tra giá trị
            console.log(`Pattern ${pattern.items.join(',')}: frequency=${frequency}/${validTransactionCount} (${(actualSupport*100).toFixed(2)}%), rawSupport=${pattern.rawSupport}`);
            
            return {
              products,
              support: actualSupport, // Tỷ lệ xuất hiện thực tế (0-1)
              confidence: pattern.confidence || 0,
              frequency: frequency, // Số đơn hàng chứa pattern
              totalTransactions: validTransactionCount, // Thêm tổng số để client có thể tính %
              // Thêm các giá trị hiển thị để tiện cho frontend
              supportPercent: `${(actualSupport*100).toFixed(1)}%`,
              frequencyDisplay: `${frequency}/${validTransactionCount}`
            };
          } catch (error) {
            console.error(`Lỗi khi lấy chi tiết pattern: ${error.message}`);
            return null;
          }
        })
      );
      
      // Lọc bỏ các pattern null
      const validPatterns = patternDetails.filter(pattern => pattern !== null);
      
      console.log(`Đã lấy chi tiết cho ${validPatterns.length} mẫu`);
      if (validPatterns.length > 0) {
        console.log(`DEBUG: Mẫu đầu tiên có ${validPatterns[0].products.length} sản phẩm`);
        console.log(`DEBUG: Tỷ lệ xuất hiện: ${validPatterns[0].support}, Tần suất: ${validPatterns[0].frequency} đơn hàng`);
      }
      
      const result = {
        frequentItemsets: validPatterns,
        message: `Danh sách sản phẩm thường được mua cùng nhau (từ ${validTransactions.length} đơn hàng)`,
        success: true,
        info: {
          totalTransactions: validTransactions.length,
          totalOrders: totalOrders,
          minSupport: adjustedMinSupport,
          processTime: (endTime-startTime)/1000
        }
      };
      
      // Lưu kết quả vào cache để sử dụng sau
      cache.set(cacheKey, result, 3600); // Cache trong 1 giờ
      
      console.log("Kết quả đã được tính toán và cache");
      return result;
    } catch (fpError) {
      console.error("Lỗi khi chạy thuật toán FP-Growth:", fpError);
      
      // Nếu FP-Growth thất bại, thử dùng Apriori làm dự phòng
      console.log("Thử dùng Apriori làm phương án dự phòng...");
      const aprioriRules = await getAprioriRecommendations();
      
      if (aprioriRules && aprioriRules.length > 0) {
        console.log(`Lấy được ${aprioriRules.length} luật từ Apriori`);
        
        // Chuyển đổi luật thành kết quả tương tự FP-Growth
        const frequentItemsets = [];
        const processedPairs = new Set();
        
        for (const rule of aprioriRules) {
          // Tạo cặp sản phẩm
          const pair = [rule.antecedent, rule.consequent].sort().join('_');
          
          // Đảm bảo không trùng lặp cặp
          if (!processedPairs.has(pair)) {
            processedPairs.add(pair);
            
            try {
              // Lấy chi tiết sản phẩm
              const products = await Product.find({ 
                _id: { $in: [rule.antecedent, rule.consequent] } 
              }).select('_id name price image category').lean();
              
              if (products.length === 2) {
                frequentItemsets.push({
                  products,
                  support: rule.support,
                  confidence: rule.confidence,
                  frequency: Math.round(rule.support * validTransactions.length)
                });
              }
            } catch (err) {
              console.error(`Lỗi khi lấy chi tiết sản phẩm cho cặp ${pair}:`, err);
            }
          }
        }
        
        // Giới hạn số lượng kết quả
        const limitedItemsets = frequentItemsets.slice(0, limit);
        
        return {
          frequentItemsets: limitedItemsets,
          message: `Danh sách sản phẩm thường được mua cùng nhau (từ Apriori)`,
          success: true,
          info: {
            totalTransactions: validTransactions.length,
            algorithm: "Apriori (FP-Growth failed)",
            minSupport: adjustedMinSupport
          }
        };
      }
      
      // Nếu cả hai thuật toán đều thất bại
      return {
        frequentItemsets: [],
        message: "Lỗi khi chạy thuật toán FP-Growth: " + fpError.message,
        success: false,
        error: fpError.message
      };
    }
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm thường mua cùng nhau:", error);
    return {
      frequentItemsets: [],
      message: "Đã xảy ra lỗi khi phân tích dữ liệu: " + error.message,
      success: false,
      error: error.message
    };
  }
};

// Lấy đề xuất sản phẩm liên quan cho trang chi tiết sản phẩm
const getRelatedProductRecommendations = async (productId, limit = 4) => {
  try {
    // Lấy thông tin sản phẩm hiện tại
    const product = await Product.findById(productId);
    if (!product) return [];

    // 1. Lấy sản phẩm từ luật kết hợp Apriori
    const rules = await getAprioriRecommendations();
    let recommendedProducts = [];

    if (rules.length > 0) {
      // Tìm các rules có sản phẩm hiện tại là antecedent
      const relevantRules = rules
        .filter(rule => rule.antecedent === productId)
        .sort((a, b) => b.confidence - a.confidence); // Sắp xếp theo confidence giảm dần

      console.log(`Tìm thấy ${relevantRules.length} luật kết hợp cho sản phẩm ${productId}`);
      
      if (relevantRules.length > 0) {
        // Lấy thông tin chi tiết của các sản phẩm được đề xuất
        const recommendedIds = [...new Set(
          relevantRules.map(rule => rule.consequent)
        )];

        // Lấy thông tin sản phẩm và kết hợp với confidence
        const productsWithConfidence = await Promise.all(
          recommendedIds.map(async (id) => {
            const product = await Product.findOne({ _id: id })
              .select('_id name price images rating numReviews');
            
            // Tìm confidence cao nhất cho sản phẩm này
            const rule = relevantRules.find(r => r.consequent === id);
            return {
              ...product.toObject(),
              confidence: rule ? rule.confidence : 0
            };
          })
        );

        // Sắp xếp theo confidence giảm dần
        recommendedProducts = productsWithConfidence
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, limit);

        console.log('Sản phẩm liên quan theo confidence:');
        recommendedProducts.forEach((p, i) => {
          console.log(`${i + 1}. ${p.name} (confidence: ${p.confidence.toFixed(2)})`);
        });
      }
    }

    // 2. Nếu không đủ sản phẩm từ Apriori, bổ sung từ cùng danh mục
    if (recommendedProducts.length < limit && product.category) {
      const categoryProducts = await Product.find({
        _id: { 
          $ne: productId,
          $nin: recommendedProducts.map(p => p._id)
        },
        category: product.category
      })
      .limit(limit - recommendedProducts.length)
      .select('_id name price images rating numReviews');

      // Thêm confidence = 0 cho các sản phẩm từ cùng danh mục
      const categoryProductsWithConfidence = categoryProducts.map(p => ({
        ...p.toObject(),
        confidence: 0
      }));

      recommendedProducts = [...recommendedProducts, ...categoryProductsWithConfidence];
    }

    // 3. Nếu vẫn không đủ, bổ sung sản phẩm có giá tương tự
    if (recommendedProducts.length < limit) {
      const priceRange = {
        min: product.price * 0.7,
        max: product.price * 1.3
      };

      const similarPriceProducts = await Product.find({
        _id: { 
          $ne: productId,
          $nin: recommendedProducts.map(p => p._id)
        },
        price: { 
          $gte: priceRange.min,
          $lte: priceRange.max
        }
      })
      .limit(limit - recommendedProducts.length)
      .select('_id name price images rating numReviews');

      // Thêm confidence = 0 cho các sản phẩm có giá tương tự
      const similarPriceProductsWithConfidence = similarPriceProducts.map(p => ({
        ...p.toObject(),
        confidence: 0
      }));

      recommendedProducts = [...recommendedProducts, ...similarPriceProductsWithConfidence];
    }

    // Log kết quả cuối cùng
    console.log(`Tổng số sản phẩm liên quan: ${recommendedProducts.length}`);
    console.log('Danh sách sản phẩm liên quan cuối cùng:');
    recommendedProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (confidence: ${p.confidence.toFixed(2)})`);
    });

    console.log('relatedProductsData:', relatedProductsData);
    console.log('relatedProducts:', recommendedProducts);

    return recommendedProducts.slice(0, limit);
  } catch (error) {
    console.error("Lỗi khi tạo đề xuất sản phẩm liên quan:", error);
    return [];
  }
};

const getDynamicAprioriParameters = (transactions) => {
  // Tính toán minSupport dựa trên số lượng giao dịch
  let minSupport = 0.01; // Default 1%
  if (transactions.length > 10000) {
    minSupport = 0.005; // 0.5% cho dữ liệu lớn
  } else if (transactions.length > 5000) {
    minSupport = 0.008; // 0.8% cho dữ liệu trung bình
  }

  // Tính toán minConfidence dựa trên phân phối dữ liệu
  let minConfidence = 0.3; // Default 30%
  const uniqueProducts = new Set(transactions.flat()).size;
  if (uniqueProducts > 1000) {
    minConfidence = 0.25; // 25% cho nhiều sản phẩm
  } else if (uniqueProducts > 500) {
    minConfidence = 0.28; // 28% cho số lượng trung bình
  }

  return { minSupport, minConfidence };
};

const updateAprioriRecommendations = async () => {
  try {
    // Thử lấy dữ liệu từ MongoDB
    const transactions = await getTransactions();
    console.log(`Fetched ${transactions.length} transactions for Apriori update`);

    // Tính toán tham số động
    const { minSupport, minConfidence } = getDynamicAprioriParameters(transactions);
    console.log(`Dynamic parameters - minSupport: ${minSupport}, minConfidence: ${minConfidence}`);

    // Khởi tạo Apriori với tham số động
    const apriori = new Apriori(minSupport, minConfidence);
    
    // Phân tích và tìm rules
    const rules = await apriori.analyze(transactions);
    console.log(`Generated ${rules.length} association rules`);

    // Lưu kết quả vào cache
    await cacheManager.set('apriori_rules', rules, 3600 * 72); // Cache trong 72 giờ
    
    // Lưu metrics
    await saveAlgorithmMetrics('apriori', {
      transactionCount: transactions.length,
      minSupport,
      minConfidence,
      rulesGenerated: rules.length,
      timestamp: new Date()
    });

    return rules;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Fallback - Sử dụng cache nếu có
    const cachedRules = await cacheManager.get('apriori_rules');
    if (cachedRules) {
      console.log('Using cached Apriori rules due to database connection issues');
      return cachedRules;
    }
    // Hoặc trả về dữ liệu mặc định
    return defaultRecommendations;
  }
};

const updateFPGrowthRecommendations = async () => {
  try {
    // Lấy dữ liệu đơn hàng mới nhất
    const orders = await Order.find({}).populate('items.product');
    
    // Chuẩn bị dữ liệu cho thuật toán FP-Growth
    const transactions = orders.map(order => 
      order.items.map(item => item.product._id.toString())
    );

    // Chạy thuật toán FP-Growth
    const minSupport = 0.01; // 1% support threshold
    const fpGrowth = new FPGrowth(minSupport);
    const frequentItemsets = await fpGrowth.findFrequentPatterns(transactions);
    
    // Lưu kết quả vào cơ sở dữ liệu hoặc cache
    // TODO: Implement caching mechanism here
    
    return frequentItemsets;
  } catch (error) {
    console.error('Error in updateFPGrowthRecommendations:', error);
    throw error;
  }
};

module.exports = { 
  getAprioriRecommendations, 
  getFPGrowthRecommendations,
  getCartRecommendations,
  getHomepageRecommendations,
  getFrequentlyBoughtTogether,
  getRelatedProductRecommendations,
  updateFPGrowthRecommendations,
  updateAprioriRecommendations,
  getDynamicAprioriParameters
};
