(ns fire-water
  (:require
   [clojure2d.core :as c2d]
   [clojure2d.color :as color]
   [fastmath.core :as math]
   [fastmath.random :as rand]))

(def n (rand/fbm-noise {:seed 7
                        :interpolation :quintic
                        :noise-type :value}))

(defn draw [canvas _ ^long frameno _]
  (let [loop 300
        frame (mod frameno loop)
        t (/ (math/abs (- (/ loop 2) frame)) 20)
        pixel-size 1
        width (/ (c2d/width canvas) pixel-size)
        height (/ (c2d/width canvas) pixel-size)
        g (color/gradient ["#91a6c9" "#91a6c9"  "#91a6c9" "#7f7e94" "#7f7e94" "#e69284" "#fec9a1"] {:interpolation :cubic-spline})
        n (rand/warp-noise-fn n 7)]

    (doseq [x (range 0 width)
            y (range 0 height)
            :let [r (n (/ x width 0.5) (/ y height 0.3) t)
                  x (* x pixel-size)
                  y (* y pixel-size)]]
      (c2d/set-color canvas (g r))
      (c2d/rect canvas x y pixel-size pixel-size))
    (c2d/save-image (c2d/get-image canvas) (format "images/%03d.png" frame))))

(comment
  (c2d/show-window
   {:canvas (c2d/canvas 1000 1000 :highest)
    :window-name (str *ns*)
    :hint :highest
    :fps 30
    :draw-fn #'draw}))
