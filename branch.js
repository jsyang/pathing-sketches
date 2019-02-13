const getDist2 = (a, b) => (b.x - a.x) ** 2 + (b.y - a.y) ** 2;

const MAX_CONNECTIONS = 4;

class Pixel {
    constructor(density, cloudWidth, svgTarget) {
        this.svgTarget = svgTarget;
        this.dist2     = Infinity;
        this.points    = [];

        for (; density-- > 0;) {
            this.points.push({
                x:           Math.random() * cloudWidth,
                y:           Math.random() * cloudWidth,
                connections: []
            });
        }
    }

    calcDist2(points) {
        points = points || this.points;

        return points.reduce(
            (accumulatedDist2, v, i) => {
                if (i < points.length - 1) {
                    return accumulatedDist2 + getDist2(points[i], points[i + 1]);
                } else {
                    return accumulatedDist2; // include back to start + getDist2(points[i], points[0]);
                }
            }, 0
        );
    }

    getNearestFrom(p) {
        let dist    = Infinity;
        let nearest = null;

        this.points.forEach(point => {
            if (point === p) return;

            let currDist = getDist2(point, p);
            if (currDist < dist) {
                dist    = currDist;
                nearest = point;
            }
        });

        return nearest;
    }

    connect() {
        this.points.forEach(p => {
            if (p.connections.length < 2) {
                p.connections.push(this.getNearestFrom(p));
            }
        });

        // connect islands
        //this.points.forEach();
    }

    draw(svgTarget) {
        svgTarget = svgTarget || this.svgTarget;

        this.points.forEach(
            point => {
                svgTarget.circle(3).move(point.x - 1.5, point.y - 1.5);

                svgTarget
                    .polyline([[point.x, point.y], ...point.connections.map(p => [p.x, p.y])])
                    .fill('none')
                    .stroke({width: 1});
            }
        );
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
            const x = getRandom(-10, 10) + e.clientX;
            const y = getRandom(-10, 10) + e.clientY;

            if (!wasCtrlDown) {
                plots.push(new Pixel(0, 0, draw));
                wasCtrlDown = true;
            }

            plots[plots.length - 1].points.push({x, y, connections: []});
            plots[plots.length - 1].draw();

        } else {
            wasCtrlDown = false;
        }
    });

    addEventListener('keydown', e => {
        let opName;

        switch (e.which) {
            case 65: // A
                opName = 'connect';
                plots.forEach(p => p.connect());
                break;

            case 83: // D

                break;
            case 68: // S
                break;
        }

        if (opName) {

            draw.clear();
            for (let i = 0; i < plots.length; i++) {
                plots[i].draw();
            }

            console.log(`${opName} DONE!`);
        }
    });
});