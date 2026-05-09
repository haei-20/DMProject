import React, { useEffect, useState } from 'react';
import { Table, Card, Badge, Spinner, Alert, Form, Row, Col, Button, Pagination } from 'react-bootstrap';
import { FaLink, FaShoppingCart, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { formatPrice } from '../../utils/productHelpers';
import { DEFAULT_PRODUCT_IMAGE_URL } from '../../constants/defaultProductImageUrl';
import { productSetSignature } from '../../utils/comboProductSet';
import './FrequentlyBoughtTogetherTable.css';

const FrequentlyBoughtTogetherTable = ({
  data,
  loading,
  isRecomputing = false,
  error,
  minSupport = 0.01,
  minItems = 2,
  orderLimit = 500,
  minConfidence = 0.1,
  minLift = 1,
  minConviction = 1,
  algorithm = 'fp-growth',
  showControls = true,
  showAlgorithmControl = true,
  onMinSupportChange,
  onMinItemsChange,
  onOrderLimitChange,
  onMinConfidenceChange,
  onMinLiftChange,
  onMinConvictionChange,
  onAlgorithmChange,
  /** Khi có hàm này, hiển thị cột nút tạo combo nhanh (vd. trang Quản lý combo) */
  onQuickCreateCombo,
  quickCreateLoading = false,
  /** Danh sách combo hiện có (vd. từ GET /combos) để hiện cột khớp */
  existingCombos = null
}) => {
  const isControlledSupport = typeof onMinSupportChange === 'function';
  const isControlledOrder = typeof onOrderLimitChange === 'function';
  const isControlledMinItems = typeof onMinItemsChange === 'function';
  const isControlledAlgorithm = typeof onAlgorithmChange === 'function';
  const isControlledMinConfidence = typeof onMinConfidenceChange === 'function';
  const isControlledMinLift = typeof onMinLiftChange === 'function';
  const isControlledMinConviction = typeof onMinConvictionChange === 'function';

  const [internalMinSupport, setInternalMinSupport] = useState(minSupport);
  const [internalMinItems, setInternalMinItems] = useState(minItems);
  const [internalOrderLimit, setInternalOrderLimit] = useState(orderLimit);
  const [internalAlgorithm, setInternalAlgorithm] = useState(algorithm);
  const [internalMinConfidence, setInternalMinConfidence] = useState(minConfidence);
  const [internalMinLift, setInternalMinLift] = useState(minLift);
  const [internalMinConviction, setInternalMinConviction] = useState(minConviction);

  const committedMinSupport = isControlledSupport ? minSupport : internalMinSupport;
  const committedOrderLimit = isControlledOrder ? orderLimit : internalOrderLimit;
  const committedMinItems = isControlledMinItems ? minItems : internalMinItems;
  const committedAlgorithm = isControlledAlgorithm ? algorithm : internalAlgorithm;
  const committedMinConfidence = isControlledMinConfidence ? minConfidence : internalMinConfidence;
  const committedMinLift = isControlledMinLift ? minLift : internalMinLift;
  const committedMinConviction = isControlledMinConviction ? minConviction : internalMinConviction;

  /** Chuỗi đang gõ — tránh parse số mỗi lần onChange (gây nhảy ô với 0., xóa, v.v.) */
  const [draftMinSupport, setDraftMinSupport] = useState(() => String(committedMinSupport));
  const [draftOrderLimit, setDraftOrderLimit] = useState(() => String(committedOrderLimit));
  const [draftMinItems, setDraftMinItems] = useState(() => String(committedMinItems));
  const [draftMinConfidence, setDraftMinConfidence] = useState(() => String(committedMinConfidence));
  const [draftMinLift, setDraftMinLift] = useState(() => String(committedMinLift));
  const [draftMinConviction, setDraftMinConviction] = useState(() => String(committedMinConviction));

  useEffect(() => {
    setDraftMinSupport(String(committedMinSupport));
  }, [committedMinSupport]);

  useEffect(() => {
    setDraftOrderLimit(String(committedOrderLimit));
  }, [committedOrderLimit]);

  useEffect(() => {
    setDraftMinItems(String(committedMinItems));
  }, [committedMinItems]);
  useEffect(() => {
    setDraftMinConfidence(String(committedMinConfidence));
  }, [committedMinConfidence]);
  useEffect(() => {
    setDraftMinLift(String(committedMinLift));
  }, [committedMinLift]);
  useEffect(() => {
    setDraftMinConviction(String(committedMinConviction));
  }, [committedMinConviction]);

  useEffect(() => {
    setInternalAlgorithm(algorithm);
  }, [algorithm]);

  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);

  useEffect(() => {
    setListPage(1);
  }, [
    data,
    committedMinSupport,
    committedOrderLimit,
    committedMinItems,
    committedAlgorithm,
    committedMinConfidence,
    committedMinLift,
    committedMinConviction
  ]);

  const parsedDraftSupport = parseFloat(draftMinSupport);
  const effectiveMinSupport =
    draftMinSupport.trim() === '' || Number.isNaN(parsedDraftSupport)
      ? committedMinSupport
      : parsedDraftSupport;

  const parsedDraftItems = parseInt(draftMinItems, 10);
  const effectiveMinItems =
    draftMinItems.trim() === '' || Number.isNaN(parsedDraftItems)
      ? committedMinItems
      : parsedDraftItems;

  
  // Debug the data coming in from the API
  useEffect(() => {
    if (data) {
      console.log("FrequentlyBoughtTogether received data:", data);
      
      if (data.frequentItemsets && data.frequentItemsets.length > 0) {
        // Log the first item for debugging
        console.log("First frequentItemset:", data.frequentItemsets[0]);
        console.log("First product:", data.frequentItemsets[0].products[0]);
        
        // Check if we're still getting mock data somehow
        const isMockData = data.frequentItemsets.some(item => 
          item.support > 0.9 || item.count > 10000 || 
          (item.products && item.products.some(p => 
            p.name?.includes('Mock') || p.name?.includes('Mẫu') || 
            p._id?.includes('mock') || p._id?.includes('sample')
          ))
        );
        
        if (isMockData) {
          console.warn('WARNING: Dữ liệu FrequentlyBoughtTogether có vẻ vẫn là dữ liệu mẫu!');
        } else {
          console.log('Đang sử dụng dữ liệu thật từ database');
        }
      }
    }
  }, [data]);

  // Function to filter items based on minSupport and minItems
  const getFilteredPatterns = () => {
    if (!data || !data.frequentItemsets) return [];
    
    // Check if frequentItemsets is not an array
    if (!Array.isArray(data.frequentItemsets)) {
      console.log("Debug - frequentItemsets is not an array:", data.frequentItemsets);
      
      // Log the entire data structure for debugging
      console.log("Debug - Complete data structure:", data);
      
      // Return empty array to prevent errors
      return [];
    }
    
    // Log data for debugging
    console.log("Processing frequentItemsets, total:", data.frequentItemsets.length);
    if (data.frequentItemsets.length > 0) {
      console.log("Sample item support:", data.frequentItemsets[0].support);
      console.log("Sample item frequency:", data.frequentItemsets[0].frequency);
      console.log("Sample item totalTransactions:", data.frequentItemsets[0].totalTransactions);
    }

    return data.frequentItemsets
      .filter(pattern => pattern.products.length >= effectiveMinItems)
      .map(pattern => {
        // Kiểm tra giá trị support
        const support = typeof pattern.support === 'number' ? pattern.support : 0;
        const frequency = typeof pattern.frequency === 'number' ? pattern.frequency : 0;
        const totalTransactions = pattern.totalTransactions || 
          data.info?.totalTransactions || 0;
        
        // Đảm bảo support nằm trong khoảng 0-1
        const normalizedSupport = Math.min(Math.max(support, 0), 1);
        
        // Log đối tượng pattern đã chuẩn hóa
        console.log(`Pattern ${pattern.products?.map(p => p._id).join(',')}: support=${normalizedSupport.toFixed(4)}, frequency=${frequency}/${totalTransactions}`);
        
        return {
          ...pattern,
          support: normalizedSupport,
          // Chỉ sửa lại support, giữ nguyên các giá trị khác
          frequency: frequency,
          totalTransactions: totalTransactions
        };
      })
      .filter(pattern => pattern.support >= effectiveMinSupport)
      .sort((a, b) => b.support - a.support);
  };

  // Get filtered patterns from real data only
  const filteredPatterns = getFilteredPatterns();

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filteredPatterns.length / listPageSize));
    setListPage((p) => Math.min(p, tp));
  }, [filteredPatterns.length, listPageSize]);

  const resolveImageSrc = (image) => {
    if (!image || typeof image !== 'string') return DEFAULT_PRODUCT_IMAGE_URL;
    const trimmed = image.trim();
    if (!trimmed) return DEFAULT_PRODUCT_IMAGE_URL;

    // Hỗ trợ trực tiếp link online http/https
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    // Đường dẫn tuyệt đối nội bộ
    if (trimmed.startsWith('/')) return trimmed;

    // Tên file/đường dẫn tương đối trong uploads
    return `/uploads/${trimmed.split('/').pop()}`;
  };

  // Format frequency number
  const formatFrequency = (frequency, totalTransactions) => {
    if (!frequency && frequency !== 0) return '0 đơn hàng';
    
    // Hiển thị dạng phân số nếu có totalTransactions
    if (totalTransactions) {
      return `${frequency}/${totalTransactions} đơn hàng`;
    }
    
    if (frequency >= 1000) {
      // For thousands, show with 1 decimal place - no space between number and K
      return `${(frequency/1000).toFixed(1).replace(/\.0$/, '')}K đơn hàng`;
    }
    
    return `${frequency} đơn hàng`;
  };

  // Format support as percentage
  const formatSupport = (support) => {
    // Check for invalid input
    if (support === undefined || support === null) return '0.0%';
    
    // Đảm bảo support là số trong khoảng 0-1
    const normalizedSupport = Math.min(Math.max(support, 0), 1);
    
    // Format với 1 chữ số thập phân và loại bỏ .0 nếu cần
    const percentage = (normalizedSupport * 100).toFixed(1).replace(/\.0$/, '');
    
    // Return the support without space after the number
    return `${percentage}%`;
  };

  // Calculate display width for support bar
  const calculateSupportWidth = (support) => {
    if (support === undefined || support === null) return '0%';
    
    // Đảm bảo support là số trong khoảng 0-1
    const normalizedSupport = Math.min(Math.max(support, 0), 1);
    
    // Scale width to make small values more visible
    // Áp dụng logarithm để giá trị nhỏ vẫn hiển thị đủ độ rộng để thấy được
    if (normalizedSupport < 0.01) {
      // Scales very small values to be at least 1%
      return `${Math.max(normalizedSupport * 100, 1)}%`;
    }
    
    return `${(normalizedSupport * 100).toFixed(1).replace(/\.0$/, '')}%`;
  };

  // Determine badge color based on support value
  const getSupportBadgeVariant = (support) => {
    if (support >= 0.2) return 'success';
    if (support >= 0.1) return 'primary';
    if (support >= 0.05) return 'info';
    if (support >= 0.01) return 'warning';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" size={18} />
          <strong>Lỗi tải dữ liệu</strong>
        </div>
        <p className="mb-0 mt-2">{error.message || 'Lỗi không xác định'}</p>
      </Alert>
    );
  }

  // Extract the renderDataTable function to avoid code duplication
  function renderDataTable(allPatterns) {
    const allCount = Array.isArray(allPatterns) ? allPatterns.length : 0;
    const hasRows = allCount > 0;
    const totalPages = Math.max(1, Math.ceil(allCount / listPageSize));
    const page = Math.min(listPage, totalPages);
    const rowOffset = (page - 1) * listPageSize;
    const patterns = hasRows ? allPatterns.slice(rowOffset, rowOffset + listPageSize) : [];
    const showQuickCreate = typeof onQuickCreateCombo === 'function';
    const showComboMatch = Array.isArray(existingCombos);
    const comboByProductSig = new Map();
    if (showComboMatch) {
      for (const combo of existingCombos) {
        if (!combo?.products?.length) continue;
        const sig = productSetSignature(combo.products);
        if (sig && !comboByProductSig.has(sig)) {
          comboByProductSig.set(sig, combo);
        }
      }
    }
    return (
      <Card className="frequently-bought-together-card">
        <Card.Header className="fbt-header">
          <div className="fbt-header-info">
            <small className="text-muted">
              {data?.info ? (
                <>
                  Dựa trên phân tích{' '}
                  <strong>{data.info.totalTransactions}</strong> giao dịch hợp lệ (≥2 SP, tối đa 20 SP/đơn)
                  {data.info.algorithm ? (
                    <> — thuật toán <strong>{data.info.algorithm}</strong></>
                  ) : null}
                  {typeof data.info.minConfidence === 'number' ? (
                    <> — minConf <strong>{data.info.minConfidence}</strong></>
                  ) : null}
                  {typeof data.info.minLift === 'number' ? (
                    <> — minLift <strong>{data.info.minLift}</strong></>
                  ) : null}
                  {typeof data.info.minConviction === 'number' ? (
                    <> — minConv <strong>{data.info.minConviction}</strong></>
                  ) : null}
                  {typeof data.info.ordersScanned === 'number' &&
                  data.info.ordersScanned > data.info.totalTransactions ? (
                    <> — đã quét <strong>{data.info.ordersScanned}</strong> đơn trong DB</>
                  ) : null}
                </>
              ) : (
                'Dựa trên dữ liệu đơn hàng'
              )}
            </small>
          </div>
          {showControls && (
          <Row className="g-2 align-items-end filter-controls fbt-controls-grid">
            <Col xs={6} md={4} lg={3}>
              <Form.Group controlId="minSupport" className="mb-0">
                <Form.Label className="small mb-1">Ngưỡng hỗ trợ</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draftMinSupport}
                  onChange={(e) => setDraftMinSupport(e.target.value)}
                  onBlur={() => {
                    const raw = parseFloat(draftMinSupport);
                    const base = Number.isNaN(raw) ? committedMinSupport : raw;
                    const clampedValue = Math.min(Math.max(base, 0.00001), 1);
                    setDraftMinSupport(String(clampedValue));
                    if (isControlledSupport) {
                      onMinSupportChange(clampedValue);
                    } else {
                      setInternalMinSupport(clampedValue);
                    }
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg={3}>
              <Form.Group controlId="minItems" className="mb-0">
                <Form.Label className="small mb-1">Số SP tối thiểu</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={draftMinItems}
                  onChange={(e) => setDraftMinItems(e.target.value.replace(/[^\d]/g, ''))}
                  onBlur={() => {
                    const raw = parseInt(draftMinItems, 10);
                    const base = Number.isNaN(raw) ? committedMinItems : raw;
                    const clampedValue = Math.max(2, base);
                    setDraftMinItems(String(clampedValue));
                    if (isControlledMinItems) {
                      onMinItemsChange(clampedValue);
                    } else {
                      setInternalMinItems(clampedValue);
                    }
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg={3}>
              <Form.Group controlId="minConfidence" className="mb-0">
                <Form.Label className="small mb-1">Min Confidence</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draftMinConfidence}
                  onChange={(e) => setDraftMinConfidence(e.target.value)}
                  onBlur={() => {
                    const raw = parseFloat(draftMinConfidence);
                    const base = Number.isNaN(raw) ? committedMinConfidence : raw;
                    const clampedValue = Math.min(Math.max(base, 0.00001), 1);
                    setDraftMinConfidence(String(clampedValue));
                    if (isControlledMinConfidence) onMinConfidenceChange(clampedValue);
                    else setInternalMinConfidence(clampedValue);
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg={3}>
              <Form.Group controlId="minLift" className="mb-0">
                <Form.Label className="small mb-1">Min Lift</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draftMinLift}
                  onChange={(e) => setDraftMinLift(e.target.value)}
                  onBlur={() => {
                    const raw = parseFloat(draftMinLift);
                    const base = Number.isNaN(raw) ? committedMinLift : raw;
                    const clampedValue = Math.max(base, 0.00001);
                    setDraftMinLift(String(clampedValue));
                    if (isControlledMinLift) onMinLiftChange(clampedValue);
                    else setInternalMinLift(clampedValue);
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg={3}>
              <Form.Group controlId="minConviction" className="mb-0">
                <Form.Label className="small mb-1">Min Conviction</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draftMinConviction}
                  onChange={(e) => setDraftMinConviction(e.target.value)}
                  onBlur={() => {
                    const raw = parseFloat(draftMinConviction);
                    const base = Number.isNaN(raw) ? committedMinConviction : raw;
                    const clampedValue = Math.max(base, 0.00001);
                    setDraftMinConviction(String(clampedValue));
                    if (isControlledMinConviction) onMinConvictionChange(clampedValue);
                    else setInternalMinConviction(clampedValue);
                  }}
                />
              </Form.Group>
            </Col>
            {showAlgorithmControl && (
            <Col xs={12} md={4} lg={3}>
              <Form.Group controlId="algorithm" className="mb-0">
                <Form.Label className="small mb-1">Thuật toán</Form.Label>
                <Form.Select
                  size="sm"
                  value={committedAlgorithm}
                  onChange={(e) => {
                    const selectedAlgorithm = e.target.value === 'apriori' ? 'apriori' : 'fp-growth';
                    if (isControlledAlgorithm) {
                      onAlgorithmChange(selectedAlgorithm);
                    } else {
                      setInternalAlgorithm(selectedAlgorithm);
                    }
                  }}
                >
                  <option value="fp-growth">FP-Growth</option>
                  <option value="apriori">Apriori</option>
                </Form.Select>
              </Form.Group>
            </Col>
            )}
            <Col xs={12} md={4} lg={3}>
              <Form.Group controlId="orderLimit" className="mb-0">
                <Form.Label className="small mb-1">Số giao dịch hợp lệ (mẫu)</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={draftOrderLimit}
                  onChange={(e) => setDraftOrderLimit(e.target.value.replace(/[^\d]/g, ''))}
                  onBlur={() => {
                    const raw = parseInt(draftOrderLimit, 10);
                    const base = Number.isNaN(raw) ? committedOrderLimit : raw;
                    const clampedValue = Math.max(1, base);
                    setDraftOrderLimit(String(clampedValue));
                    if (isControlledOrder) {
                      onOrderLimitChange(clampedValue);
                    } else {
                      setInternalOrderLimit(clampedValue);
                    }
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <div className="fbt-recomputing">
                {isRecomputing && (
                  <div className="d-flex align-items-center gap-2 text-primary small">
                    <Spinner animation="border" size="sm" />
                    <span>Đang chạy lại thuật toán...</span>
                  </div>
                )}
              </div>
            </Col>
          </Row>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          <div className="px-3 pt-3">
            {!hasRows ? (
                <Alert variant="info" className="m-3 mb-3 fbt-empty-alert">
                  <div className="d-flex align-items-center">
                    <FaInfoCircle className="me-2" />
                    <strong>Không có dữ liệu hiển thị</strong>
                  </div>
                  <p className="mb-2 mt-2 small">
                    Chưa đủ dữ liệu để phân tích hành vi mua kèm, hoặc bộ lọc hiện tại không khớp mẫu nào. Cần ít nhất 2 đơn hàng có sản phẩm chung.
                  </p>
                  <p className="mb-1 small fw-semibold">Nguyên nhân có thể:</p>
                  <ul className="small mb-0 ps-3">
                    <li>Hệ thống chưa có đủ đơn hàng</li>
                    <li>Các đơn hàng chưa có sản phẩm trùng nhau</li>
                    <li>Ngưỡng hỗ trợ đang quá cao (thử giảm xuống 0.0001 hoặc thấp hơn)</li>
                  </ul>
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table className="align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Tần suất mua kèm</th>
                        <th>Tỉ lệ xuất hiện</th>
                        <th>Tổng giá trị</th>
                        {showComboMatch ? (
                          <th className="fbt-match-col">Khớp combo</th>
                        ) : null}
                        {showQuickCreate ? (
                          <th className="fbt-quick-create-col text-end">Thao tác</th>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {patterns.map((pattern, idx) => {
                        const rowKey = rowOffset + idx;
                        const patternSig = productSetSignature(pattern?.products);
                        const matchedCombo =
                          showComboMatch && patternSig ? comboByProductSig.get(patternSig) : null;
                        return (
                        <tr key={patternSig ? `${patternSig}-${rowKey}` : rowKey}>
                          <td>
                            <div className="product-combination">
                              {pattern.products.map((product, productIdx) => (
                                <div key={product._id} className="product-item-combo">
                                  <div className="product-image">
                                    {product.image ? (
                                      <img
                                        src={resolveImageSrc(product.image)}
                                        alt={product.name}
                                        onError={(e) => {
                                          if (e.target.src === DEFAULT_PRODUCT_IMAGE_URL) return;
                                          console.log("Debug - Image failed to load:", product.image);
                                          e.target.onerror = null;
                                          e.target.src = DEFAULT_PRODUCT_IMAGE_URL;
                                        }}
                                      />
                                    ) : (
                                      <div className="placeholder-image">
                                        {product.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="product-info">
                                    <div className="product-name">{product.name}</div>
                                    <div className="product-meta">
                                      <span className="product-price">{formatPrice(product.price)}</span>
                                      <span className="product-category">{product.category}</span>
                                    </div>
                                  </div>
                                  {productIdx < pattern.products.length - 1 && (
                                    <div className="link-icon">
                                      <FaLink />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <Badge bg={getSupportBadgeVariant(pattern.support)} className="frequency-badge">
                              {pattern.frequencyDisplay || formatFrequency(pattern.frequency, pattern.totalTransactions)}
                            </Badge>
                          </td>
                          <td className="support-column">
                            <div className="support-value">{pattern.supportPercent || formatSupport(pattern.support)}</div>
                            <div className="support-bar">
                              <div
                                className="support-fill"
                                style={{ width: calculateSupportWidth(pattern.support) }}
                              />
                            </div>
                          </td>
                          <td>
                            {formatPrice(pattern.products.reduce((total, product) => total + product.price, 0))}
                          </td>
                          {showComboMatch ? (
                            <td className="fbt-match-col">
                              {matchedCombo ? (
                                <div className="fbt-match-wrap">
                                  <Badge bg="success" className="mb-1">
                                    Đã khớp
                                  </Badge>
                                  <div className="small text-break" title={matchedCombo.name}>
                                    {matchedCombo.name}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted small">Chưa có combo trùng nhóm SP</span>
                              )}
                            </td>
                          ) : null}
                          {showQuickCreate ? (
                            <td className="fbt-quick-create-col text-end">
                              <Button
                                variant="primary"
                                size="sm"
                                className="fbt-btn-create-combo"
                                disabled={
                                  quickCreateLoading ||
                                  !pattern.products ||
                                  pattern.products.length < 2 ||
                                  !!matchedCombo
                                }
                                onClick={() => onQuickCreateCombo(pattern)}
                              >
                                {matchedCombo ? 'Đã có combo' : 'Tạo combo'}
                              </Button>
                            </td>
                          ) : null}
                        </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
              {hasRows ? (
                <div className="fbt-pagination-bar px-3 pb-3 pt-2 d-flex flex-wrap align-items-center justify-content-between gap-2 border-top">
                  <small className="text-muted">
                    <strong>
                      {rowOffset + 1}–{Math.min(rowOffset + patterns.length, allCount)}
                    </strong>{' '}
                    / {allCount} · Trang <strong>{page}</strong> / {totalPages}
                  </small>
                  <Pagination size="sm" className="mb-0 flex-wrap">
                    <Pagination.Prev
                      disabled={page <= 1}
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    />
                    <Pagination.Next
                      disabled={page >= totalPages}
                      onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                    />
                  </Pagination>
                  <Form.Select
                    size="sm"
                    className="fbt-page-size-select"
                    value={listPageSize}
                    onChange={(e) => {
                      setListPageSize(Number(e.target.value) || 10);
                      setListPage(1);
                    }}
                  >
                    <option value={5}>5 dòng / trang</option>
                    <option value={10}>10 dòng / trang</option>
                    <option value={20}>20 dòng / trang</option>
                    <option value={50}>50 dòng / trang</option>
                  </Form.Select>
                </div>
              ) : null}
          </div>
        </Card.Body>
        {hasRows && (
          <Card.Footer className="text-muted">
            <small>
              <FaShoppingCart className="me-1" />
              Dữ liệu thực từ cơ sở dữ liệu. Các sản phẩm này thường được khách hàng mua cùng nhau.
              {showComboMatch ? (
                <>
                  {' '}
                  Cột <strong>Khớp combo</strong>: trùng khi <strong>tập sản phẩm</strong> (theo{' '}
                  <code>_id</code>) giống hệt một combo đang lưu, không phân biệt thứ tự (mỗi SP trong combo chỉ
                  tính một lần).
                </>
              ) : null}
            </small>
          </Card.Footer>
        )}
      </Card>
    );
  }

  return renderDataTable(filteredPatterns);
};

export default FrequentlyBoughtTogetherTable; 