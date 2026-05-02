import React from 'react';
import { Button } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import './SlidingDrawer.css';

const SlidingDrawer = ({ isOpen, onClose, title, position = 'right', children }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'show' : ''}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`sliding-drawer ${position} ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>{title}</h2>
          <Button variant="link" className="close-btn" onClick={onClose}>
            <FaTimes />
          </Button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </>
  );
};

export default SlidingDrawer; 