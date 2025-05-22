import numpy as np

def infer_current_state(detections: np.ndarray) -> str:
    states = ["Present", "Absent"]
    
    # Transition probabilities
    A = {
        "Present": {"Present": 0.95, "Absent": 0.05},
        "Absent":  {"Present": 0.05, "Absent": 0.95}
    }
    
    # Observation probabilities
    B = {
        "Present": {True: 0.9, False: 0.1},   # P(observed | state)
        "Absent":  {True: 0.2, False: 0.8}
    }
    
    # Initial probabilities
    Pi = {
        "Present": 0.5,
        "Absent":  0.5
    }

    T = len(detections)
    V = [{} for _ in range(T)]
    path = {}

    # Initialization
    for state in states:
        V[0][state] = Pi[state] * B[state][detections[0]]
        path[state] = [state]

    # DP
    for t in range(1, T):
        new_path = {}
        for curr_state in states:
            max_prob, best_prev = max(
                (V[t-1][prev_state] * A[prev_state][curr_state] * B[curr_state][detections[t]], prev_state)
                for prev_state in states
            )
            V[t][curr_state] = max_prob
            new_path[curr_state] = path[best_prev] + [curr_state]
        path = new_path

    # Final state: pick the most probable state at the last time step
    final_state = max(V[-1], key=V[-1].get)
    return final_state

class ViterbiTagTracker:
    def __init__(self):
        # State indices: 0 = Present, 1 = Absent
        self.num_states = 2

        # Transition matrix A[i][j] = P(state_j | state_i)
        self.A = np.array([
            [0.95, 0.05],  # from Present
            [0.05, 0.95]   # from Absent
        ])

        # Observation matrix B[j][o] = P(observation o | state j)
        # o: 0 = False (NotDetected), 1 = True (Detected)
        self.B = np.array([
            [0.1, 0.9],  # Present
            [0.8, 0.2]   # Absent
        ])

        # Initial state probabilities
        self.V_prev = np.array([0.5, 0.5])  # [Present, Absent]

    def update(self, detection: bool) -> str:
        """
        detection: bool (True=Detected, False=NotDetected)
        returns: "Present" or "Absent" (most probable state)
        """
        obs_index = int(detection)  # 1 if True, 0 if False

        # Compute max over previous states for each current state
        V_curr = np.max(self.V_prev[:, None] * self.A * self.B[:, obs_index], axis=0)

        # Update for next time step
        self.V_prev = V_curr

        return "Present" if np.argmax(V_curr) == 0 else "Absent"

class MultiTagViterbiTracker:
    def __init__(self, num_tags):
        self.N = num_tags  # Number of tags

        # Transition probabilities: shape (2, 2)
        self.A = np.array([
            [0.95, 0.05],  # From Present
            [0.05, 0.95]   # From Absent
        ])

        # Observation probabilities: shape (2, 2)
        # Rows: state 0=Present, 1=Absent
        # Cols: obs 0=False (NotDetected), 1=True (Detected)
        self.B = np.array([
            [0.1, 0.9],   # Present
            [0.8, 0.2]    # Absent
        ])

        # Initialize previous Viterbi probabilities: shape (N, 2)
        self.V_prev = np.full((num_tags, 2), 0.5)

    def update(self, detections: np.ndarray) -> np.ndarray:
        """
        detections: shape (N,) boolean array — True = Detected, False = NotDetected
        returns: shape (N,) array of most probable states as strings
        """
        obs_idx = detections.astype(int)  # (N,) → 0 or 1

        # Gather observation probabilities: shape (N, 2)
        # For each tag, select B[:, obs_idx] transposed
        B_obs = self.B[:, obs_idx].T  # shape (N, 2)

        # V_prev: shape (N, 2)
        # A: shape (2, 2)
        # We want to compute V_next[i, j] = max_k V_prev[i, k] * A[k, j] * B[j, obs]
        # Vectorized way:
        # For each tag, compute: (V_prev @ A) * B_obs

        V_tmp = self.V_prev @ self.A  # shape (N, 2)
        V_curr = V_tmp * B_obs        # elementwise multiply

        self.V_prev = V_curr  # update internal state

        # Get most probable state index (0=Present, 1=Absent)
        most_likely = np.argmax(V_curr, axis=1)

        # Convert to string labels if needed
        state_labels = np.array(["Present", "Absent"])
        return state_labels[most_likely]


if __name__ == "__main__":
    detections = np.array([True, True, False, False, True])
    current_state = infer_current_state(detections)
    print(f"Current state: {current_state}")

    print("Viterbi Tag Tracker:")

    tracker = ViterbiTagTracker()

    for t, d in enumerate(detections):
        state = tracker.update(d)
        print(f"t={t}: Detected={d}, State={state}")

    
    print("MultiTag Viterbi Tracker:")
    num_tags = 5
    tracker = MultiTagViterbiTracker(num_tags)

    for t in range(3):
        detections = np.random.rand(num_tags) > 0.3  # Random boolean array
        states = tracker.update(detections)
        print(f"t={t}, detections={detections}, states={states}")