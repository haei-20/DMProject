import React, { useState } from 'react';
import { 
  Card, Row, Col, Badge, Button, Table, Modal, Form, Alert
} from 'react-bootstrap';
import { 
  useUpdateOrderStatusMutation, 
  useUpdateOrderToDeliveredMutation,
  useAddOrderNoteMutation
} from '../../services/api';
import { formatDate } from '../../utils/formatters';
import './OrderDetail.css';

const OrderDetail = ({ order, onClose }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');
  
  // API mutations
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [markAsDelivered, { isLoading: isMarkingDelivered }] = useUpdateOrderToDeliveredMutation();
  const [addOrderNote, { isLoading: isAddingNote }] = useAddOrderNoteMutation();
  
  // Get order status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };
  
  // Format date
  const formatDateTime = (date) => {
    return date ? formatDate(date, { includeTime: true }) : 'N/A';
  };
  
  // Handle status update
  const handleUpdateStatus = async () => {
    if (!newStatus) {
      setError('Please select a status');
      return;
    }
    
    try {
      await updateOrderStatus({
        id: order._id,
        status: newStatus,
        note: statusNote
      }).unwrap();
      setShowStatusModal(false);
      setStatusNote('');
      setNewStatus('');
    } catch (err) {
      setError(err.data?.message || 'Failed to update order status');
    }
  };
  
  // Handle mark as delivered
  const handleMarkAsDelivered = async () => {
    try {
      await markAsDelivered({
        id: order._id,
        note: 'Marked as delivered by admin'
      }).unwrap();
    } catch (err) {
      setError(err.data?.message || 'Failed to mark order as delivered');
    }
  };
  
  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setError('Please enter a note');
      return;
    }
    
    try {
      await addOrderNote({
        id: order._id,
        note: newNote
      }).unwrap();
      setShowNoteModal(false);
      setNewNote('');
    } catch (err) {
      setError(err.data?.message || 'Failed to add note');
    }
  };
  
  // Calculate total
  const calculateTotal = () => {
    const itemsTotal = order.orderItems.reduce(
      (acc, item) => acc + (item.price * item.quantity), 0
    );
    return (itemsTotal + (order.shippingPrice || 0) + (order.taxPrice || 0)).toFixed(2);
  };
  
  if (!order) return null;
  
  return (
    <div className="order-detail-component">
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Order #{order.orderNumber || order._id}</h4>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Order Status</h5>
                <small className="text-muted">
                  Created on {formatDateTime(order.createdAt)}
                </small>
              </div>
              <Badge bg={getStatusColor(order.status)} className="order-status-badge">
                {order.status?.toUpperCase()}
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="timeline-container">
                {order.statusUpdates?.map((update, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-icon">
                      <span className={`status-dot ${getStatusColor(update.status)}`}></span>
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-date">{formatDateTime(update.date)}</p>
                      <h6 className="mb-1">Status changed to {update.status.toUpperCase()}</h6>
                      {update.note && <p className="mb-0">{update.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-actions mt-3">
                <Button 
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => setShowStatusModal(true)}
                  disabled={isUpdatingStatus}
                >
                  Update Status
                </Button>
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button 
                    variant="outline-success"
                    size="sm"
                    className="me-2"
                    onClick={handleMarkAsDelivered}
                    disabled={isMarkingDelivered}
                  >
                    Mark as Delivered
                  </Button>
                )}
                <Button 
                  variant="outline-info"
                  size="sm"
                  onClick={() => setShowNoteModal(true)}
                  disabled={isAddingNote}
                >
                  Add Note
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Items</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="order-item-image me-2">
                            <img src={item.image} alt={item.name} />
                          </div>
                          <div>
                            <p className="mb-0">{item.name}</p>
                            {item.color && <small className="text-muted">Color: {item.color}</small>}
                            {item.size && <small className="text-muted">Size: {item.size}</small>}
                          </div>
                        </div>
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                    <td className="text-end">
                      ${order.orderItems?.reduce((a, i) => a + i.price * i.quantity, 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Tax:</strong></td>
                    <td className="text-end">${order.taxPrice?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Shipping:</strong></td>
                    <td className="text-end">${order.shippingPrice?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td className="text-end price-total">${calculateTotal()}</td>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Customer Information</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-1"><strong>Name:</strong> {order.user?.name}</p>
              <p className="mb-1"><strong>Email:</strong> {order.user?.email}</p>
              <p className="mb-0"><strong>Phone:</strong> {order.shippingAddress?.phone || 'N/A'}</p>
              
              <hr className="my-3" />
              
              <h6>Shipping Address</h6>
              <p className="mb-0">
                {order.shippingAddress?.address}, <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}, <br />
                {order.shippingAddress?.country}
              </p>
              
              <hr className="my-3" />
              
              <h6>Payment Information</h6>
              <p className="mb-1">
                <strong>Method:</strong> {order.paymentMethod}
              </p>
              <p className="mb-1">
                <strong>Status:</strong>{' '}
                <Badge bg={order.isPaid ? 'success' : 'warning'} pill>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </Badge>
              </p>
              {order.isPaid && (
                <p className="mb-0">
                  <strong>Paid on:</strong> {formatDateTime(order.paidAt)}
                </p>
              )}
              {order.paymentResult && (
                <>
                  <p className="mb-1">
                    <strong>Transaction ID:</strong> {order.paymentResult.id}
                  </p>
                  <p className="mb-0">
                    <strong>Status:</strong> {order.paymentResult.status}
                  </p>
                </>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Notes</h5>
            </Card.Header>
            <Card.Body>
              {order.notes && order.notes.length > 0 ? (
                <div className="notes-list">
                  {order.notes.map((note, index) => (
                    <div key={index} className="note-item">
                      <p className="note-date">{formatDateTime(note.createdAt)}</p>
                      <p className="note-text">{note.text}</p>
                      <p className="note-author">{note.user ? `By: ${note.user}` : 'System'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No notes added yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Status</Form.Label>
              <Form.Select 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Note (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add details about this status change..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateStatus}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Add Note Modal */}
      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddNote}
            disabled={isAddingNote}
          >
            {isAddingNote ? 'Adding...' : 'Add Note'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDetail; 