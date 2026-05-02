import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email && /^\S+@\S+\.\S+$/.test(email)) {
      try {
        // Simplified newsletter subscription - can be implemented later
        console.log('Newsletter subscription for:', email);
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 5000);
      } catch (err) {
        console.error('Failed to subscribe:', err);
      }
    }
  };

  return (
    <footer className="footer mt-auto py-5">
      <Container>
        <Row className="mb-4">
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <h5 className="text-uppercase mb-4">Siêu thị bán lẻ</h5>
            <p>
              Chúng tôi sử dụng công nghệ khai phá dữ liệu để gợi ý các combo ưu đãi phù hợp với bạn.
              Hệ thống tự động phân tích các sản phẩm thường được mua cùng nhau và đề xuất những gói khuyến mãi giúp bạn tiết kiệm hơn.
            </p>
            <div className="social-icons">
              <a href="#!" className="me-3"><FaFacebook size={20} /></a>
              <a href="#!" className="me-3"><FaTwitter size={20} /></a>
              <a href="#!" className="me-3"><FaInstagram size={20} /></a>
              <a href="#!" className="me-3"><FaYoutube size={20} /></a>
            </div>
          </Col>
          
          <Col lg={2} md={6} className="mb-4 mb-lg-0">
            <h5 className="text-uppercase mb-4">Shop</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="/" className="footer-link">Sữa</a>
              </li>
              <li className="mb-2">
                <a href="/" className="footer-link">Hóa phẩm</a>
              </li>
              <li className="mb-2">
                <a href="/" className="footer-link">Bánh kẹo</a>
              </li>
              <li className="mb-2">
                <a href="/" className="footer-link">Văn phòng phẩm - Đồ chơi</a>
              </li>
            </ul>
          </Col>
          
          <Col lg={2} md={6} className="mb-4 mb-lg-0">
            <h5 className="text-uppercase mb-4">Hỗ trợ</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="footer-link">Trung tâm trợ giúp</a>
              </li>
              <li className="mb-2">
                <a href="#" className="footer-link">Thông tin giao hàng</a>
              </li>
              <li className="mb-2">
                <a href="#" className="footer-link">Hoàn tiền</a>
              </li>
              <li className="mb-2">
                <a href="#" className="footer-link">Liên hệ</a>
              </li>
            </ul>
          </Col>
          
          <Col lg={4} md={6}>
            <h5 className="text-uppercase mb-4">Bản tin</h5>
            <p>Đăng ký để nhận cập nhật, ưu đãi độc quyền và nhiều thông tin khác.</p>
            <Form onSubmit={handleSubscribe}>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Email của bạn"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary">
                  <FaEnvelope className="me-2" />
                  Đăng ký
                </Button>
              </InputGroup>
              {subscribed && (
                <p className="text-success small">
                  Cảm ơn bạn vì đã đăng ký!
                </p>
              )}
            </Form>
          </Col>
        </Row>
        
        <hr className="my-4" />
        
        <Row className="align-items-center">
          <Col md={7} className="mb-3 mb-md-0">
            <p className="small mb-0">
              &copy; {new Date().getFullYear()} Siêu thị bán lẻ. Bản quyền thuộc về 2NADH.
            </p>
          </Col>
          <Col md={5} className="text-md-end">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <a href="/" className="footer-link small">Chính sách quyền riêng tư</a>
              </li>
              <li className="list-inline-item">
                <span className="mx-2">•</span>
              </li>
              <li className="list-inline-item">
                <a href="/" className="footer-link small">Điều khoản</a>
              </li>
              <li className="list-inline-item">
                <span className="mx-2">•</span>
              </li>
              <li className="list-inline-item">
                <a href="/" className="footer-link small">Cookie</a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 