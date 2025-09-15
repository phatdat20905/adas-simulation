# core/pothole_detection.py
import cv2
import numpy as np

class PotholeDetector:
    def __init__(self, confidence_threshold=0.5):
        self.confidence_threshold = confidence_threshold
        
    def detect_potholes(self, frame):
        """
        Phát hiện ổ gà sử dụng image processing
        """
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        
        # Use adaptive thresholding
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 11, 2)
        
        # Morphological operations to clean up the image
        kernel = np.ones((3, 3), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        potholes = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if 100 < area < 5000:  # Filter by size
                x, y, w, h = cv2.boundingRect(contour)
                
                # Calculate confidence based on area and aspect ratio
                aspect_ratio = w / h
                confidence = min(area / 2000, 1.0)  # Normalize
                
                if 0.3 < aspect_ratio < 3.0:  # Reasonable aspect ratio for potholes
                    potholes.append({
                        "bbox": [x, y, x + w, y + h],
                        "confidence": confidence,
                        "area": area,
                        "type": "pothole"
                    })
        
        return potholes
    
    def draw_potholes(self, frame, potholes):
        """Vẽ bounding box cho ổ gà"""
        for pothole in potholes:
            if pothole["confidence"] > self.confidence_threshold:
                x1, y1, x2, y2 = pothole["bbox"]
                confidence = pothole["confidence"]
                
                # Determine color based on confidence
                if confidence > 0.7:
                    color = (0, 0, 255)  # Red for high confidence
                else:
                    color = (0, 165, 255)  # Orange for medium confidence
                
                # Draw rectangle and label
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"Ổ gà {confidence:.2f}", (x1, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        return frame