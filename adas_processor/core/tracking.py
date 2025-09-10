# core/tracking.py
import time

class ObjectTracker:
    """
    Simple tracker state to estimate relative speed from consecutive distance estimates.
    estimate_speed returns (speed_kmh, v_rel_m_s)
    - speed_kmh: float or None
    - v_rel_m_s: float (m/s) positive when object is approaching, negative when receding
    """
    def __init__(self):
        # track_id -> (last_distance_m, last_timestamp)
        self.last_distances = {}

    def estimate_speed(self, track_id, dist):
        """Estimate speed (km/h) and relative speed (m/s) for a track_id given current distance.
        If not enough history, returns (None, None).
        """
        now = time.time()

        # If we have no previous value, store and return None
        if track_id not in self.last_distances or self.last_distances[track_id][0] is None:
            self.last_distances[track_id] = (dist, now)
            return None, None

        prev_dist, prev_t = self.last_distances[track_id]
        dt = now - prev_t
        if dt <= 1e-3:
            return None, None

        # positive v_rel means approaching (prev_dist > dist)
        v_rel = (prev_dist - dist) / dt  # m/s
        speed_kmh = v_rel * 3.6
        # update stored last distance/time
        self.last_distances[track_id] = (dist, now)

        return speed_kmh, v_rel
