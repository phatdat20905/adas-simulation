# core/lane_detection.py
import cv2
import numpy as np
from config.config import LANE_DEPARTURE_THRESHOLD

class LaneDepartureWarning:
    def __init__(self, warning_threshold=LANE_DEPARTURE_THRESHOLD):
        # Parameters for lane detection
        self.kernel_size = 5
        self.low_threshold = 50
        self.high_threshold = 150
        self.rho = 2
        self.theta = np.pi/180
        self.threshold = 15
        self.min_line_length = 40
        self.max_line_gap = 20
        
        # Lane departure parameters
        self.warning_threshold = warning_threshold
        self.warning_count = 0
        self.warning_active = False
        
        # Smoothing parameters
        self.smoothing_factor = 0.7
        self.previous_lane_center = None
        self.previous_deviation = 0.0
        
        # Frame counter for debugging
        self.frame_count = 0
        
    def region_of_interest(self, img, vertices):
        mask = np.zeros_like(img)
        if len(img.shape) > 2:
            channel_count = img.shape[2]
            ignore_mask_color = (255,) * channel_count
        else:
            ignore_mask_color = 255
            
        cv2.fillPoly(mask, vertices, ignore_mask_color)
        masked_image = cv2.bitwise_and(img, mask)
        return masked_image

    def draw_lines(self, img, lines, color=[255, 0, 0], thickness=10):
        if lines is None:
            return img
            
        img_copy = np.copy(img)
        line_img = np.zeros((img.shape[0], img.shape[1], 3), dtype=np.uint8)
        
        for line in lines:
            for x1, y1, x2, y2 in line:
                cv2.line(line_img, (x1, y1), (x2, y2), color, thickness)
                
        img_copy = cv2.addWeighted(img_copy, 0.8, line_img, 1.0, 0.0)
        return img_copy

    def detect_lanes(self, frame):
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blur_gray = cv2.GaussianBlur(gray, (self.kernel_size, self.kernel_size), 0)
        
        # Apply Canny edge detection
        edges = cv2.Canny(blur_gray, self.low_threshold, self.high_threshold)
        
        # Define region of interest (ROI)
        height, width = edges.shape
        roi_vertices = np.array([[
            (width * 0.1, height),
            (width * 0.45, height * 0.6),
            (width * 0.55, height * 0.6),
            (width * 0.9, height)
        ]], dtype=np.int32)
        
        masked_edges = self.region_of_interest(edges, roi_vertices)
        
        # Apply Hough transform
        lines = cv2.HoughLinesP(
            masked_edges, self.rho, self.theta, self.threshold,
            np.array([]), self.min_line_length, self.max_line_gap
        )
        
        return lines, roi_vertices

    def process_lanes(self, lines, frame_shape):
        if lines is None:
            return None, None
            
        left_lines = []
        right_lines = []
        
        height, width = frame_shape
        
        for line in lines:
            for x1, y1, x2, y2 in line:
                # Calculate slope
                if x2 - x1 == 0:
                    continue
                    
                slope = (y2 - y1) / (x2 - x1)
                
                # Filter lines based on slope (more restrictive)
                if abs(slope) < 0.3 or abs(slope) > 0.8:  # Tighter slope range
                    continue
                    
                # Filter based on line length
                line_length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                if line_length < 30:  # Minimum line length
                    continue
                    
                if slope < 0:
                    left_lines.append((x1, y1, x2, y2))
                else:
                    right_lines.append((x1, y1, x2, y2))
        
        return left_lines, right_lines

    def calculate_lane_position(self, left_lines, right_lines, frame_shape):
        height, width = frame_shape
        
        # Calculate average position of left and right lanes
        left_x = None
        right_x = None
        
        if left_lines and len(left_lines) > 0:
            left_x = np.mean([(x1 + x2) / 2 for x1, y1, x2, y2 in left_lines])
        
        if right_lines and len(right_lines) > 0:
            right_x = np.mean([(x1 + x2) / 2 for x1, y1, x2, y2 in right_lines])
        
        # Calculate lane center
        if left_x is not None and right_x is not None:
            current_lane_center = (left_x + right_x) / 2
        elif left_x is not None:
            current_lane_center = left_x + width * 0.2  # Estimate right lane
        elif right_x is not None:
            current_lane_center = right_x - width * 0.2  # Estimate left lane
        else:
            return None, width / 2, 0.0, 0, 0  # Return default values
        
        # Apply smoothing
        if self.previous_lane_center is None:
            smoothed_lane_center = current_lane_center
        else:
            smoothed_lane_center = (self.smoothing_factor * self.previous_lane_center + 
                                   (1 - self.smoothing_factor) * current_lane_center)
        
        self.previous_lane_center = smoothed_lane_center
        image_center = width / 2
        
        # Calculate deviation from center
        deviation = (smoothed_lane_center - image_center) / image_center
        
        # Smooth deviation
        smoothed_deviation = (self.smoothing_factor * self.previous_deviation + 
                             (1 - self.smoothing_factor) * deviation)
        self.previous_deviation = smoothed_deviation
        
        left_count = len(left_lines) if left_lines else 0
        right_count = len(right_lines) if right_lines else 0
        
        return smoothed_lane_center, image_center, smoothed_deviation, left_count, right_count

    def check_departure_warning(self, deviation):
        if abs(deviation) > self.warning_threshold:
            self.warning_count += 1
            if self.warning_count > 3:  # Fewer frames for faster response
                self.warning_active = True
                return True
        else:
            self.warning_count = max(0, self.warning_count - 1)
            self.warning_active = False
            
        return False

    def process_frame(self, frame, draw=True):
        """Process frame for lane detection
        
        Args:
            frame: Input frame
            draw: Whether to draw visualization on the frame
            
        Returns:
            tuple: (warning, deviation, processed_frame)
        """
        self.frame_count += 1
        
        # Detect lanes
        lines, roi_vertices = self.detect_lanes(frame)
        
        # Process lanes
        left_lines, right_lines = self.process_lanes(lines, frame.shape[:2])
        
        # Calculate lane position
        result = self.calculate_lane_position(left_lines, right_lines, frame.shape[:2])
        
        if result[0] is None:  # No lanes detected
            lane_center, image_center, deviation, left_count, right_count = None, frame.shape[1] / 2, 0.0, 0, 0
            warning = False
        else:
            lane_center, image_center, deviation, left_count, right_count = result
            warning = self.check_departure_warning(deviation)
        
        processed_frame = frame.copy()
        
        # Draw visualization if requested
        if draw:
            # Draw detected lanes with different colors
            if lines is not None:
                # Draw all lines in blue
                processed_frame = self.draw_lines(processed_frame, lines, color=[255, 0, 0])
                
                # Draw left lines in green and right lines in red
                if left_lines:
                    for x1, y1, x2, y2 in left_lines:
                        cv2.line(processed_frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
                
                if right_lines:
                    for x1, y1, x2, y2 in right_lines:
                        cv2.line(processed_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
            
            # Draw ROI
            cv2.polylines(processed_frame, roi_vertices, True, (0, 255, 0), 2)
            
            # Draw center lines
            if image_center is not None:
                cv2.line(processed_frame, (int(image_center), processed_frame.shape[0]), 
                        (int(image_center), int(processed_frame.shape[0] * 0.6)), (0, 255, 255), 2)
            
            if lane_center is not None:
                cv2.line(processed_frame, (int(lane_center), processed_frame.shape[0]), 
                        (int(lane_center), int(processed_frame.shape[0] * 0.6)), (255, 255, 0), 2)
            
            # Draw lane count information
            cv2.putText(processed_frame, f"Left lines: {left_count}", (10, 30),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(processed_frame, f"Right lines: {right_count}", (10, 50),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Check for lane departure and draw warning
            if warning:
                # Draw warning with blinking effect
                if self.frame_count % 10 < 5:  # Blink every 5 frames
                    cv2.putText(processed_frame, "LANE DEPARTURE WARNING!", (50, 100),
                              cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
                    cv2.rectangle(processed_frame, (30, 70), (processed_frame.shape[1]-30, 140), (0, 0, 255), 3)
            
            # Display deviation info with color coding
            color = (0, 255, 0)  # Green for normal
            if abs(deviation) > self.warning_threshold:
                color = (0, 0, 255)  # Red for warning
            
            cv2.putText(processed_frame, f"Deviation: {deviation:.3f}", (50, 50),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Display frame count for debugging
            cv2.putText(processed_frame, f"Frame: {self.frame_count}", (processed_frame.shape[1]-150, 30),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        return warning, deviation, processed_frame

    def get_debug_info(self):
        """Return debug information for analysis"""
        return {
            'frame_count': self.frame_count,
            'warning_active': self.warning_active,
            'warning_count': self.warning_count
        }

    def reset(self):
        """Reset the lane detector state"""
        self.warning_count = 0
        self.warning_active = False
        self.previous_lane_center = None
        self.previous_deviation = 0.0
        self.frame_count = 0