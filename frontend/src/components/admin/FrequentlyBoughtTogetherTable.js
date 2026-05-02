import React, { useState, useEffect } from 'react';
import { Table, Card, Badge, Spinner, Alert, Form, Row, Col, Button } from 'react-bootstrap';
import { FaLink, FaShoppingCart, FaInfoCircle, FaExclamationTriangle, FaBoxOpen } from 'react-icons/fa';
import { formatPrice } from '../../utils/productHelpers';
import './FrequentlyBoughtTogetherTable.css';

const FrequentlyBoughtTogetherTable = ({ data, loading, error }) => {
  const [minSupport, setMinSupport] = useState(0.01);
  const [minItems, setMinItems] = useState(2);
  
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
      .filter(pattern => pattern.products.length >= minItems)
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
      .filter(pattern => pattern.support >= minSupport)
      .sort((a, b) => b.support - a.support);
  };

  // Get filtered patterns from real data only
  const filteredPatterns = getFilteredPatterns();

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
          <strong>Error loading data</strong>
        </div>
        <p className="mb-0 mt-2">{error.message || 'Unknown error'}</p>
      </Alert>
    );
  }

  if (!data || !data.frequentItemsets || data.frequentItemsets.length === 0) {
    return (
      <div>
        <Alert variant="info">
          <div className="d-flex align-items-center">
            <FaInfoCircle className="me-2" />
            <strong>No data available</strong>
          </div>
          <p className="mt-2">
            There's not enough data to analyze shopping patterns. At least 2 orders with common products are needed.
          </p>
          
          <div className="mt-3">
            <p className="mb-2">Possible causes:</p>
            <ul>
              <li>Not enough orders in the system</li>
              <li>Orders don't have common products</li>
              <li>MinSupport value is too high (try reducing to 0.0001 or lower)</li>
            </ul>
          </div>
        </Alert>
      </div>
    );
  }

  // Extract the renderDataTable function to avoid code duplication
  function renderDataTable(patterns) {
    return (
      <Card className="frequently-bought-together-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">Frequently Bought Together Products</h5>
            <small className="text-muted">
              Based on analysis of {data.info ? `${data.info.totalTransactions} orders` : 'order data'}
            </small>
          </div>
          <Row className="g-2 align-items-center filter-controls">
            <Col>
              <Form.Group controlId="minSupport" className="mb-0">
                <Form.Label className="small mb-0">Min Support</Form.Label>
                <Form.Select 
                  size="sm"
                  value={minSupport}
                  onChange={(e) => setMinSupport(parseFloat(e.target.value))}
                >
                  <option value="0.01">1%</option>
                  <option value="0.005">0.5%</option>
                  <option value="0.001">0.1%</option>
                  <option value="0.0005">0.05%</option>
                  <option value="0.0001">0.01%</option>
                  <option value="0.00005">0.005%</option>
                  <option value="0.00001">0.001%</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="minItems" className="mb-0">
                <Form.Label className="small mb-0">Min Items</Form.Label>
                <Form.Select
                  size="sm" 
                  value={minItems}
                  onChange={(e) => setMinItems(parseInt(e.target.value))}
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Tần suất mua kèm</th>
                  <th>Tỉ lệ xuất hiện</th>
                  <th>Tổng giá trị</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="product-combination">
                        {pattern.products.map((product, productIdx) => (
                          <div key={product._id} className="product-item-combo">
                            <div className="product-image">
                              {product.image ? (
                                <img 
                                  src={product.image}
                                  alt={product.name} 
                                  onError={(e) => {
                                    console.log("Debug - Image failed to load:", product.image);
                                    e.target.onerror = null; 
                                    
                                    // Thử một số phương pháp dự phòng khác nhau
                                    if (product.image.startsWith('http')) {
                                      // Nếu đã là URL đầy đủ, hiển thị placeholder
                                      e.target.parentNode.innerHTML = `<div class="placeholder-image">${product.name.substring(0, 2).toUpperCase()}</div>`;
                                    } 
                                    else if (product.image.includes('/')) {
                                      // Nếu có dấu / thì có thể là đường dẫn tương đối, thử đường dẫn khác
                                      e.target.src = `/uploads/${product.image.split('/').pop()}`;
                                      e.target.onerror = () => {
                                        e.target.parentNode.innerHTML = `<div class="placeholder-image">${product.name.substring(0, 2).toUpperCase()}</div>`;
                                      };
                                    }
                                    else {
                                      // Thử xem là tên file đơn giản
                                      e.target.src = `/uploads/${product.image}`;
                                      e.target.onerror = () => {
                                        e.target.parentNode.innerHTML = `<div class="placeholder-image">${product.name.substring(0, 2).toUpperCase()}</div>`;
                                      };
                                    }
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
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <Card.Footer className="text-muted">
          <small>
            <FaShoppingCart className="me-1" />
            Dữ liệu thực từ cơ sở dữ liệu. Các sản phẩm này thường được khách hàng mua cùng nhau. 
          </small>
        </Card.Footer>
      </Card>
    );
  }

  return renderDataTable(filteredPatterns);
};

export default FrequentlyBoughtTogetherTable; 