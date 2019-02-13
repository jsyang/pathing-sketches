const getDist2 = (a, b) => (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;

class Pixel {
    constructor(density, cloudWidth, svgTarget) {
        this.svgTarget = svgTarget;
        this.dist2     = Infinity;
        this.points    = [];

        for (; density-- > 0;) {
            this.points.push([Math.random() * cloudWidth, Math.random() * cloudWidth]);
        }

        if (this.points.length > 0) {
            this.dist2 = this.calcDist2();
        }
    }

    calcDist2(points) {
        points = points || this.points;

        return points.reduce(
            (accumulatedDist2, v, i) => {
                if (i < points.length - 1) {
                    return accumulatedDist2 + getDist2(points[i], points[i + 1]);
                } else {
                    //return accumulatedDist2; // include back to start + getDist2(points[i], points[0]);
                    return accumulatedDist2 + getDist2(points[i], points[0]);
                }
            }, 0
        );
    }

    updateIfNewTourIsShorter(newPoints) {
        const newDist2 = this.calcDist2(newPoints);

        if (this.dist2 > newDist2) {
            this.points = newPoints;
            this.dist2  = newDist2;
        }
    }

    flip(length) {
        let potentialNewPoints = [];

        for (let i = 0; i < this.points.length; i++) {

            let head = this.points.slice(0, i);
            let body = this.points.slice(i, i + length).reverse();
            let tail = this.points.slice(i + length);

            potentialNewPoints = [
                ...head,
                ...body,
                ...tail
            ];

            this.updateIfNewTourIsShorter(potentialNewPoints);
        }
    }

    move(length) {
        let potentialNewPoints = [], newPoints = [], pullIndex, pushIndex;

        for (pullIndex = 0; pullIndex < this.points.length; pullIndex++) {
            for (pushIndex = 0; pushIndex < this.points.length; pushIndex++) {
                if (pullIndex === pushIndex) continue;

                let pulled = this.points.slice(pullIndex, pullIndex + length);

                newPoints = this.points.slice();
                newPoints.splice.apply(newPoints, [pullIndex, length]);
                newPoints.splice.apply(newPoints, [Math.min(newPoints.length, pushIndex), 0, ...pulled]);

                potentialNewPoints.push(newPoints);
            }
        }

        potentialNewPoints.forEach(this.updateIfNewTourIsShorter.bind(this));
    }

    swap(length) {
        let potentialNewPoints = [], newPoints = [], pullIndex, pushIndex;

        for (pullIndex = 0; pullIndex < this.points.length; pullIndex++) {
            for (pushIndex = 0; pushIndex < this.points.length; pushIndex++) {
                let smallerIndex = Math.min(pushIndex, pullIndex);
                let biggerIndex  = Math.max(pushIndex, pullIndex);

                let firstSequence  = this.points.slice(smallerIndex, smallerIndex + length);
                let secondSequence = this.points.slice(biggerIndex, biggerIndex + length);

                // -A- -B- --C-- --D-- -E-
                // 1 2 3 4 5 6 7 8 9 0 ...
                //     ^^^       ^^^^^
                // smallerIndex == 2
                // biggerIndex  == 7
                // firstSeq.length  = 2 (B)
                // secondSeq.length = 3 (D)

                newPoints = [
                    ...this.points.slice(0, smallerIndex), // A
                    ...secondSequence, // D
                    ...this.points.slice(smallerIndex + firstSequence.length, biggerIndex), // C
                    ...firstSequence, // B
                    ...this.points.slice(biggerIndex + secondSequence.length) // E
                ];

                potentialNewPoints.push(newPoints);
            }
        }

        potentialNewPoints.forEach(this.updateIfNewTourIsShorter.bind(this));
    }

    draw(svgTarget) {
        svgTarget = svgTarget || this.svgTarget;

        this.points.forEach(
            point => svgTarget.circle(3).move(point[0] - 1.5, point[1] - 1.5)
        );

        svgTarget
            .polyline(this.points.concat([this.points[0]])) // back to start
            // .polyline(this.points) // unconnected to start
            .fill('none')
            .stroke({width: 1});
    }
}

function getRandom(min, max) {
    return min + Math.random() * (max - min);
}

const plots     = [];
let wasCtrlDown = false;

addEventListener('DOMContentLoaded', () => {
    const draw = SVG('drawing');

    addEventListener('mousemove', e => {
        if (e.ctrlKey) {
            const newX = getRandom(-10, 10) + e.clientX;
            const newY = getRandom(-10, 10) + e.clientY;

            if (!wasCtrlDown) {
                plots.push(new Pixel(0, 0, draw));
                wasCtrlDown = true;
            }

            plots[plots.length - 1].points.push([newX, newY]);
            plots[plots.length - 1].draw();

        } else {
            wasCtrlDown = false;
        }
    });

    addEventListener('keydown', e => {
        let opName;

        switch (e.which) {
            case 65: // A
                opName = 'flip';

                for (let i = 0; i < plots.length; i++) {
                    for (let len = plots[i].points.length; len > 1; len--) {
                        plots[i].flip(len);
                    }
                }
                break;


            case 83: // D
                opName = 'swap';

                for (let i = 0; i < plots.length; i++) {
                    for (let len = plots[i].points.length; len > 1; len--) {
                        plots[i].swap(len);
                    }
                }

                break;
            case 68: // S
                opName = 'move';
                draw.clear();

                for (let i = 0; i < plots.length; i++) {
                    for (let len = plots[i].points.length; len > 1; len--) {
                        plots[i].move(len);
                    }
                }

                break;
        }

        if (opName) {
            //console.log({opName, dist: p.dist2.toFixed(2)});

            draw.clear();
            for (let i = 0; i < plots.length; i++) {
                plots[i].draw();
            }

            console.log(`${opName} DONE!`);
        }
    });
});