(ns ps4-boids
  (:require
   [clojure2d.core :as c2d]
   [clojure2d.color :as color]
   [fastmath.core :as math]
   [fastmath.distance :as dist]
   [fastmath.vector :as vect]
   [fastmath.random :as rand]))

(def boids
  (let [r (rand/rng :jdk 1)]
    (vec
     (for [_ (range 400)]
       {:x (+ 350 (rand/drandom r 300))
        :y (+ 350 (rand/drandom r 300))
        :dx (rand/drandom r -1 1)
        :dy (rand/drandom r -1 1)}))))

(defn neighbors [boid boids]
  (let [p [(:x boid) (:y boid)]]
    (->> boids
         (filter (fn [n]
                   (< (dist/euclidean [(:x n) (:y n)] p)
                      35))))))

(defn clamp [a mn mx]
  (math/max mn (math/min a mx)))

(defn box-sdf [p b]
  (let [[x y] (vect/sub (vect/abs p) b)]
    (+ (min (max x y) 0.0)
       (vect/mag [(max x 0) (max y 0)]))))

(defn circle-sdf [p r]
  (- (vect/mag p) r))

(def k (math/sqrt 3.0))

(defn triangle-sdf [[x y] r]
  (let [x (- (math/abs x) r)
        y (+ y (/ r k))
        [x y] (if (< 0.0 (+ x (* k y)))
                [(/ (- x (* k y)) 2.0) (/ (- (- (* k x)) y) 2.0)]
                [x y])
        x (- x (clamp x (* -2.0 r) 0.0))]
    (* (- (vect/mag [x y])) (math/signum y))))

(defn x-sdf [p w r]
  (let [[x y] (vect/abs p)
        m (* 0.5 (math/min (+ x y) w))
        d (vect/mag [(- x m) (- y m)])]
    (- d r)))

(defn step [boids]
  (vec
   (for [{:keys [x y dx dy] :as boid} boids]
     (let [cs [(- 200 x) (- 500 y)]
           ct [(- 500 x) (- 220 y)]
           cc [(- 775 x) (- 500 y)]
           cx [(- 500 x) (- 800 y)]

           cd (vect/normalize (min-key vect/mag cc cs ct cx))
           d (min-key abs
                      (box-sdf cs [120 120])
                      (triangle-sdf ct 140)
                      (circle-sdf cc 150)
                      (x-sdf cx 200 20))
           c 0.015
           dd (vect/normalize (vect/add [dx dy] (vect/mult cd (* c d))))

           nrs (neighbors boid boids)
           rx (apply + (map #(- x %) (map :x nrs)))
           ry (apply + (map #(- y %) (map :y nrs)))
           [rx ry] (vect/normalize [rx ry])
           c 0.4
           [dx dy] (vect/normalize (vect/add dd (vect/mult [rx ry] c)))

           speed 4.0]

       {:x (+ x (* speed dx))
        :y (+ y (* speed dy))
        :dx dx
        :dy dy}))))

(def steps
  (-> (iterate #(conj % (step (peek %))) [boids])
      (nth 300)))

(defn draw [canvas _ ^long frameno _]
  (c2d/set-background canvas :black)
  (let [loop (count steps)
        frame (mod frameno loop)
        boids (get steps frame)
        size 2
        g (color/gradient (color/palette 20))]
    (doseq [i (range (count boids))]
      (let [history (take-last 25 (map #(nth % i) (take frame steps)))
            paths (partition 2 1 history)
            n (count paths)]
        (doseq [i (range n)]
          (let [[a b] (nth paths i)]
            (c2d/set-color canvas (g (- 1.0 (/ i n))))
            (c2d/line canvas (:x a) (:y a) (:x b) (:y b))))))
    (doseq [{:keys [x y]} boids]
      (c2d/set-color canvas (g 1))
      (c2d/ellipse canvas x y size size))

    #_(c2d/save-image (c2d/get-image canvas) (format "images/%03d.png" frame))))

(comment
  (c2d/show-window
   {:canvas (c2d/canvas 1000 1000 :highest)
    :window-name (str *ns*)
    :hint :highest
    :fps 30
    :draw-fn #'draw}))
