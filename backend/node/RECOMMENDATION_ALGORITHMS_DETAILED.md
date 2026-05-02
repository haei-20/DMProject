# Chi Tiết Các Hàm & Thuật Toán Khai Phá Luật Kết Hợp

## 📋 Tổng Quan

File: `backend/node/services/recommendationService.js`

Dùng 2 thuật toán để tìm sản phẩm thường mua cùng nhau:
1. **Apriori** — Code tay (nested loop, đếm cặp sản phẩm)
2. **FP-Growth** — Thư viện `node-fpgrowth` (hiệu quả hơn)

---

## 🔍 BƯỚC 1: LẤY DỮ LIỆU (`getTransactions`)

### Vị trí: Dòng 10–122

### Mục đích
Lấy danh sách giao dịch (đơn hàng) từ MongoDB, biến đổi thành format dùng cho thuật toán.

### Chi tiết từng bước:

#### Bước 1a: Kết nối DB & Lấy Orders
```javascript
const orders = await Order.find({})
  .sort({ createdAt: -1 })
  .limit(limit)
  .select(projection)
  .lean();
```
- **`.find({})`** — lấy tất cả Order documents từ collection `Order`
- **`.sort({ createdAt: -1 })`** — sắp xếp từ mới nhất về cũ
- **`.limit(limit)`** — nếu `limit > 0`, chỉ lấy `limit` orders (để tăng tốc độ testing)
- **`.select(projection)`** — chỉ lấy 3 fields: `orderItems.product`, `orderItems.qty`, `_id` (giảm dữ liệu truyền)
- **`.lean()`** — trả về plain object (không instance của Mongoose), nhanh hơn

**Output:** Array của objects, mỗi object là 1 order:
```javascript
[
  {
    _id: "507f...",
    orderItems: [
      { product: ObjectId("..."), qty: 2 },
      { product: ObjectId("..."), qty: 1 }
    ]
  },
  ...
]
```

#### Bước 1b: Biến đổi Orders thành Transactions
```javascript
for (const order of orders) {
  if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
    const productIds = new Set();
    
    for (const item of order.orderItems) {
      if (item && item.product) {
        const productId = typeof item.product === 'object' && item.product._id 
          ? item.product._id.toString() 
          : item.product.toString();
        
        productIds.add(productId);  // Thêm mỗi sản phẩm 1 lần (không lặp theo qty)
      }
    }
    
    const uniqueProductIds = [...productIds];
    
    // Chỉ lưu transaction nếu có ≥2 sản phẩm khác nhau
    if (uniqueProductIds.length >= 2) {
      transactions.push(uniqueProductIds);
    }
  }
}
```

**Chi tiết:**
- Duyệt qua từng order
- Với mỗi order, lấy tất cả `product._id` (chuyển thành string)
- Dùng `Set` để đảm bảo không trùng lặp (mỗi sản phẩm chỉ xuất hiện 1 lần trong transaction)
- Chỉ thêm transaction nếu ≥2 sản phẩm (cặp hoặc nhóm lớn hơn)

**Output:** Array of Array — mỗi phần tử là 1 transaction (list product IDs):
```javascript
[
  ["5fa1...", "5fa2...", "5fa3..."],  // Order 1 có 3 sản phẩm
  ["5fa1...", "5fa4..."],             // Order 2 có 2 sản phẩm
  ...
]
```

#### Bước 1c: Kiểm tra số lượng & Tạo dữ liệu mẫu
```javascript
if (transactions.length < 5) {
  // Không đủ dữ liệu thực → tạo dữ liệu mẫu từ sản phẩm thực
  const allProducts = await Product.find({}).select('_id').lean();
  const productIds = allProducts.map(product => product._id.toString());
  
  // Tạo 20-50 giao dịch mẫu ngẫu nhiên
  for (let i = 0; i < numTransactions; i++) {
    const numProducts = Math.floor(Math.random() * 4) + 2; // 2-5 sản phẩm/transaction
    const shuffled = [...productIds].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffled.slice(0, numProducts);
    sampleTransactions.push(selectedProducts);
  }
  
  return sampleTransactions;
}
```

**Mục đích:** Nếu dữ liệu thực quá ít, tạo test data từ sản phẩm thực để thuật toán có đủ dữ liệu để chạy.

#### Bước 1d: Return
```javascript
return transactions;  // Array of arrays, sẵn sàng cho Apriori/FP-Growth
```

---

## 🏗️ THUẬT TOÁN 1: APRIORI (Code Tay)

### Vị trí: Dòng 134–230

### Mục đích
Tìm các cặp sản phẩm (hoặc nhóm sản phẩm) thường mua cùng nhau, rồi sinh "luật kết hợp" (Association Rules).

### Quy trình Apriori:

#### Giai đoạn 1: Chuẩn bị dữ liệu
```javascript
const getAprioriRecommendations = async () => {
  const cachedData = cache.get("apriori");
  if (cachedData) return cachedData;  // Kiểm tra cache (10 phút)
  
  const transactions = await getTransactions();  // Lấy dữ liệu
```
- Kiểm tra cache để tránh tính lại nếu còn trong TTL
- Gọi `getTransactions()` để lấy danh sách transactions

#### Giai đoạn 2: Tính tham số động
```javascript
const minSupport = Math.max(1 / transactions.length, 0.01);
const minConfidence = 0.1;

console.log(`Chạy Apriori với minSupport=${minSupport}, minConfidence=${minConfidence}`);
```

**Ý nghĩa:**
- **minSupport:** Tối thiểu 1 giao dịch hoặc 1%. VD: nếu 100 transactions, minSupport = 0.01 (1%).
  - Cặp sản phẩm phải xuất hiện ≥1% trong tất cả transactions mới được xem là "frequent"
- **minConfidence:** 10% — luật A→B phải có confidence ≥10% để được giữ

#### Giai đoạn 3: Đếm Frequent Itemsets (2-itemsets)
```javascript
const pairs = new Map();
const productCount = new Map();

transactions.forEach(transaction => {
  // Đếm số lần xuất hiện của từng sản phẩm
  transaction.forEach(productId => {
    productCount.set(productId, (productCount.get(productId) || 0) + 1);
  });

  // Tạo các cặp sản phẩm (2-itemsets)
  for (let i = 0; i < transaction.length; i++) {
    for (let j = i + 1; j < transaction.length; j++) {
      const pair = [transaction[i], transaction[j]].sort().join('_');
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
    }
  }
});
```

**Chi tiết:**

1. **Duyệt qua mỗi transaction:**
   ```
   transaction = ["productA", "productB", "productC"]
   ```

2. **Đếm sản phẩm riêng lẻ:**
   ```
   productCount = {
     "productA": 5,
     "productB": 8,
     "productC": 3
   }
   ```
   
3. **Tạo cặp sản phẩm (2-combinations):**
   ```
   Với transaction = ["productA", "productB", "productC"]
   Tạo cặp:
   - [productA, productB] → "productA_productB"
   - [productA, productC] → "productA_productC"
   - [productB, productC] → "productB_productC"
   
   pairs = {
     "productA_productB": 3,  // xuất hiện 3 lần
     "productA_productC": 1,
     "productB_productC": 2
   }
   ```

#### Giai đoạn 4: Lọc theo minSupport & Tính Confidence
```javascript
const rules = [];
pairs.forEach((count, pair) => {
  const [product1, product2] = pair.split('_');
  const support = count / transactions.length;

  if (support >= minSupport) {
    // Tính confidence 2 chiều
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
```

**Ví dụ tính toán:**
```
Giả sử:
- Tổng transactions = 100
- Cặp (productA, productB) xuất hiện: 15 lần
- productA xuất hiện: 50 lần
- productB xuất hiện: 30 lần
- minSupport = 0.01 (1%)
- minConfidence = 0.1 (10%)

Tính toán:
1. support(A, B) = 15 / 100 = 0.15 (15%) ✅ >= minSupport (1%)

2. confidence(A → B) = 15 / 50 = 0.3 (30%) ✅ >= minConfidence (10%)
   → Luật "Nếu mua A thì mua B" với độ tin cậy 30%
   
3. confidence(B → A) = 15 / 30 = 0.5 (50%) ✅ >= minConfidence
   → Luật "Nếu mua B thì mua A" với độ tin cậy 50%

Kết quả: 2 luật được thêm vào rules array
```

#### Giai đoạn 5: Sắp xếp & Lưu Cache
```javascript
rules.sort((a, b) => {
  if (b.confidence !== a.confidence) {
    return b.confidence - a.confidence;  // Sắp xếp theo confidence giảm dần
  }
  return b.support - a.support;  // Nếu confidence bằng, sắp xếp theo support
});

cache.set("apriori", rules);  // Lưu vào cache 10 phút
return rules;
```

**Output Cuối cùng:**
```javascript
[
  {
    antecedent: "productA",      // Nếu mua sản phẩm A
    consequent: "productB",       // Thì mua sản phẩm B
    support: 0.15,                // 15% đơn hàng có cả A và B
    confidence: 0.3               // 30% người mua A cũng mua B
  },
  {
    antecedent: "productB",
    consequent: "productA",
    support: 0.15,
    confidence: 0.5
  },
  ...
]
```

---

## 📊 THUẬT TOÁN 2: FP-GROWTH (Thư viện)

### Vị trí: Dòng 238–252

### Mục đích
Tìm frequent itemsets (cặp hoặc nhóm sản phẩm) hiệu quả hơn Apriori bằng cách xây dựng cây FP-tree.

### Quy trình FP-Growth:

#### Bước 1: Lấy dữ liệu & Tính minSupport động
```javascript
const getFPGrowthRecommendations = async () => {
  const cachedData = cache.get("fp-growth");
  if (cachedData) return cachedData;  // Kiểm tra cache

  const transactions = await getTransactions();  // Lấy transactions
  const minSupport = getDynamicMinSupport(transactions.length);  // Tính động
  
  const fpgrowth = new FPGrowth.FPGrowth(minSupport);  // Khởi tạo object
```

**`getDynamicMinSupport` (dòng 131–137):**
```javascript
const getDynamicMinSupport = (numTransactions) => {
  if (numTransactions < 50) return 0.05;      // Dữ liệu ít (< 50) → 5%
  if (numTransactions < 500) return 0.1;      // Dữ liệu trung (50-499) → 10%
  return 0.2;                                  // Dữ liệu nhiều (≥500) → 20%
};
```

**Lý do:** 
- Dữ liệu ít → giảm minSupport để có nhiều itemsets
- Dữ liệu nhiều → tăng minSupport để giảm noise

#### Bước 2: Chạy thuật toán FP-Growth
```javascript
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
```

**Chi tiết:**
- **`.exec(transactions)`** — Thư viện `node-fpgrowth` nhận transactions array và chạy thuật toán
- **`.filter(pattern => pattern.items.length > 1)`** — Chỉ giữ itemsets ≥2 sản phẩm
- **Output:** Array of objects:
  ```javascript
  [
    {
      items: ["productA", "productB"],
      support: 0.15
    },
    {
      items: ["productB", "productC"],
      support: 0.08
    },
    ...
  ]
  ```

#### Bước 3: So sánh FP-Growth vs Apriori

| Tiêu chí | Apriori (Code Tay) | FP-Growth (Thư viện) |
|---------|-------------------|---------------------|
| **Cách hoạt động** | Nested loop, đếm cặp | Xây dựng FP-tree, chi phí tìm kiếm |
| **Tốc độ** | Chậm (O(n²)) với dữ liệu lớn | Nhanh (O(n)) |
| **Output** | Luật (A→B) có confidence | Frequent itemsets (nhóm) |
| **Phù hợp** | Dữ liệu nhỏ (<500 transactions) | Dữ liệu lớn |
| **Tuỳ chỉnh** | Dễ thay đổi threshold | Phụ thuộc thư viện |

---

## 🎯 SỬ DỤNG KẾT QUẢ: `getCartRecommendations`

### Vị trí: Dòng 258–340

### Mục đích
Khi user xem giỏ hàng, gợi ý sản phẩm liên quan dựa trên luật Apriori.

### Quy trình:

#### Bước 1: Lấy Product IDs từ giỏ hàng
```javascript
const cartProductIds = cartItems
  .filter(item => item.product !== null && item.product !== undefined)
  .map(item => {
    if (typeof item.product === 'object' && item.product._id) {
      return item.product._id.toString();
    }
    return item.product.toString();
  }).filter(id => id);
```
- **Input:** `cartItems` = mảng items từ Cart model (populated)
- **Filter null:** Loại bỏ items có product bị xóa
- **Output:** `["productA", "productB", ...]`

#### Bước 2: Lấy luật Apriori
```javascript
const rules = await getAprioriRecommendations();  // Gọi Apriori

const relevantRules = rules.filter(rule => 
  (rule.antecedent && cartProductIds.includes(rule.antecedent.toString())) ||
  (rule.consequent && cartProductIds.includes(rule.consequent.toString()))
);
```
- Lọc chỉ các luật có **antecedent** hoặc **consequent** trùng với sản phẩm trong giỏ
- VD: Giỏ có productA → lấy luật "A→B", "C→A", v.v.

#### Bước 3: Sinh danh sách gợi ý
```javascript
let recommendedProductIds = new Set();

relevantRules.forEach(rule => {
  if (rule.antecedent && cartProductIds.includes(rule.antecedent.toString())) {
    if (rule.consequent && !cartProductIds.includes(rule.consequent.toString())) {
      recommendedProductIds.add(rule.consequent.toString());
    }
  }
  if (rule.consequent && cartProductIds.includes(rule.consequent.toString())) {
    if (rule.antecedent && !cartProductIds.includes(rule.antecedent.toString())) {
      recommendedProductIds.add(rule.antecedent.toString());
    }
  }
});

recommendedProductIds = [...recommendedProductIds].slice(0, limit);
```

**Logic:**
- Nếu antecedent trong giỏ → gợi ý consequent
- Nếu consequent trong giỏ → gợi ý antecedent
- Loại bỏ sản phẩm đã có trong giỏ (dùng `.includes()`)
- Dùng `Set` để tránh trùng lặp
- Giới hạn số lượng (default = 4)

#### Bước 4: Lấy thông tin chi tiết & Trả về
```javascript
const recommendedProducts = await Product.find({ 
  _id: { $in: recommendedProductIds } 
}).select('_id name price image rating numReviews');

return recommendedProducts;
```

**Output (cho Cart API):**
```javascript
{
  items: [...],  // Sản phẩm trong giỏ
  recommendations: [
    { _id: "...", name: "Sản phẩm X", price: 100, image: "...", ... },
    { _id: "...", name: "Sản phẩm Y", price: 200, image: "...", ... }
  ]
}
```

---

## 📡 FLOW TOÀN BỘ (End-to-End)

```
Frontend (OrderPage.js)
    ↓
  GET /api/cart
    ↓
Backend cartController.getCart()
    ↓
  await getCartRecommendations(cart.items)  ← RecommendationService
    ↓
  await getAprioriRecommendations()
    ↓
  await getTransactions()
    ↓
  Database: find Orders → transform → transactions array
    ↓
  Apriori thuật toán:
    - Đếm frequent pairs
    - Tính support/confidence
    - Sinh rules
    ↓
  Lọc rules liên quan → Sinh product IDs → Query Product → JSON response
    ↓
Frontend nhận:
{
  items: [...],
  recommendations: [...]  ← Hiển thị "Mua cùng" section
}
```

---

## 🔧 CÁC NGƯỠNG CẦN CHỈNH

### `getTransactions()` (dòng 40)
```javascript
const projection = { 'orderItems.product': 1, 'orderItems.qty': 1, '_id': 1 };
```
→ Thêm/bớt fields cần thiết

### `getAprioriRecommendations()` (dòng 148–149)
```javascript
const minSupport = Math.max(1 / transactions.length, 0.01);
const minConfidence = 0.1;
```
→ Điều chỉnh để có nhiều/ít luật

### `getCartRecommendations()` (dòng 331)
```javascript
recommendedProductIds = [...recommendedProductIds].slice(0, limit);
```
→ `limit = 4` (mặc định) → thay đổi để có nhiều/ít gợi ý

---

Tóm lại: **Apriori** dễ hiểu nhưng chậm, **FP-Growth** nhanh nhưng phụ thuộc thư viện. Code của bạn dùng cả 2, với **Apriori** là nguồn chính cho `getCartRecommendations()`.
