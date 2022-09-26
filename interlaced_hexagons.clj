(ns interlaced-hexagons
  (:require
   [clojure2d.core :as c2d]
   [fastmath.core :as math]
   [fastmath.grid :as grid]))

(defn draw [canvas _ ^long frameno _]
  (let [loop 120
        frame (mod frameno loop)
        tilt (math/sin (math/radians 35))
        t (- (/ loop 2) frame)
        s (math/sin (math/radians 49))
        cell-size 130
        grid (grid/grid :pointy-hex cell-size)
        max-x (/ (c2d/width canvas) cell-size 0.7)
        max-y (/ (c2d/height canvas) cell-size 0.7)
        shift (* 0.088 cell-size (math/cos (/ t 10.)))]

    (c2d/set-background canvas "#677da4")
    (c2d/set-stroke canvas (/ cell-size 6) :round)

    (doseq [x (range max-x)
            y (range max-y)]
      (let [[mx my] (grid/cell->mid grid [x y])
            [mx my :as mid] [(- mx (* y cell-size s tilt) shift)
                             my]
            corners (grid/pointy-hex-corners (/ cell-size 2) mid)
            corners (for [[cx cy] corners] [(+ cx (* (- my cy) tilt)) cy])
            [r-bot-w bot-w l-bot-w l-top-w top-w r-top-w] corners

            [mx my] (grid/cell->mid grid [x y])
            [mx my :as mid] [(- mx (* y cell-size s tilt) (* 0.43 cell-size) (- shift))
                             (+ my (* 0.38 cell-size))]
            corners (grid/pointy-hex-corners (/ cell-size 2) mid)
            corners (for [[cx cy] corners] [(+ cx (* (- cy my) tilt)) cy])
            [r-bot-b bot-b l-bot-b l-top-b top-b r-top-b] corners]

        (c2d/set-color canvas :black)
        (c2d/line canvas top-b l-top-b)
        (c2d/line canvas r-top-b top-b)
        (c2d/line canvas l-top-b l-bot-b)

        (c2d/set-color canvas :white)
        (c2d/line canvas top-w l-top-w)
        (c2d/line canvas l-top-w l-bot-w)
        (c2d/line canvas top-w r-top-w)))

    (c2d/save-image (c2d/get-image canvas) (format "images/%03d.png" frame))))

(comment
  (c2d/show-window
   {:canvas (c2d/canvas 1000 1000 :highest)
    :window-name (str *ns*)
    :hint :highest
    :fps 30
    :draw-fn #'draw}))
