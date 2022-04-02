const _seg = (x1, y1, x2, y2, stroke = 'rgb(0, 0, 0)') => ({x1, y1, x2, y2, stroke});
const getLine = ({x1, y1, x2, y2}) => ([x1, y1, x2, y2]);
const getStroke = ({stroke}) => stroke;

let factor = (mult = 1) => rndMinMaxInt(0, rndMinMaxInt(1, 3)) * mult;

class Worm {
  id = null;
  stroke = 'rgb(0, 0, 0)'
  x = 0;
  y = 0;

  borderX = 2;
  borderY = 2;

  borderWidth = 2;
  borderHeight = 2;


  length = 15;

  maxLength = 1024 * 4;

  segments = [];

  deg = rndMinMaxInt(0, 360);
  degVariants = range(0, 360, 90);
  oldDeg = 0;

  lastSegment = null;
  firstSegment = null;

  isStop = false;

  isVisDetect = true;
  isVisHead = true;
  isVisSegemntsEnd = true;


  constructor ({x, y, width, height}) {
    this.id = getRndId();
    this.borderWidth = width;
    this.borderHeight = height;
    this.borderX = x;
    this.borderY = y;
  }

  step({obstacles = []}) {
    if(this.isStop) return false;
    let segment = co(getLast(this.segments) || this.initPosition);
    let tmpSegment = co(segment);
    segment.x1 = segment.x2;
    segment.y1 = segment.y2;

    let isRunCycle = true;
    let safeMax = 400;
    let safeCount = 0;
    let x2 = null;
    let y2 = null;

    while (isRunCycle) {
      if(++safeCount > safeMax) {
        this.isStop = true;
        isRunCycle = false;
      }
      this.changeDeg(degGuard(this.deg + 180));
      if(this.isGoingBack) {
        // console.log('VVV', this.direction);
        this.changeDeg(degGuard(this.deg + 180));
        return;
      }
      let { x2: _x2, y2: _y2 } = getRelativeLine({
        x: segment.x1,
        y: segment.y1,
        deg: this.deg,
        length: this.length * 2
      });


      let isCrossed = this.testCrossed({
        segment: {...segment, x2: _x2, y2: _y2},
        obstacles
      });

      if(isCrossed) {
        if(this.isVisDetect) {
          strokeWeight(2);
          stroke(`rgb(255,0,0)`);
          line(...getLine({
            ...segment,
            x2: _x2,
            y2: _y2
          }));
          strokeWeight(1);
        }
        rndCoinBool() && this.segments.shift();
        // if(rndCoinBool() && rndCoinBool()) this.changeDeg(degGuard(this.deg + 180));
        this.segments.pop();
        this.segments.pop();
        return;
      }
      if(!isCrossed) {
        if(this.isVisDetect) {
          strokeWeight(2);
          stroke(`rgb(0,200,0)`);
          line(...getLine({
            ...segment,
            x2: _x2,
            y2: _y2
          }));
          strokeWeight(1);
        }
        x2 = _x2;
        y2 = _y2;
        isRunCycle = false;
      }
    }

    this.oldDeg = this.deg;
    this.lastSegment = this.segments.at(-1) || this.lastSegment;
    this.firstSegment = this.segments.at(0) || this.firstSegment;

    let { x2: __x2, y2: __y2 } = getRelativeLine({
      x: segment.x1,
      y: segment.y1,
      deg: this.deg,
      length: this.length
    });

    segment.x2 = __x2;
    segment.y2 = __y2;

    segment.stroke = `rgb(${rndMinMaxInt(0, 20)}, ${rndMinMaxInt(0, 10)}, ${rndMinMaxInt(0, 255)})`;

    if( segment.x2 >= this.maxX) {
      segment.x2 += -(this.length);
      this.deg = degGuard(this.deg + 180);
      this.oldDeg = this.deg;
    }
    if( segment.y2 >= this.maxY) {
      segment.y2 += -(this.length);
      this.deg = degGuard(this.deg + 180);
      this.oldDeg = this.deg;
    }

    if( segment.x2 <= this.minX) {
      segment.x2 += this.length;
      this.deg = degGuard(this.deg + 180);
      this.oldDeg = this.deg;
    }
    if( segment.y2 <= this.minY) {
      segment.y2 += this.length;
      this.deg = degGuard(this.deg + 180);
      this.oldDeg = this.deg;
    }

    if(this.segments.length > this.maxLength) this.segments.shift();
    if(this.isVisHead) {
      strokeWeight(10);
      stroke('rgba(127, 0, 127, 1)');
      point(segment.x2, segment.y2);
      if(this.segments.at(0)) {
        stroke('rgba(0, 127, 127, 1)');
        point(this.segments.at(0).x1, this.segments.at(0).y1);
      }
      strokeWeight(1);
    }

    this.segments.push(segment);
  }

  testCrossed({
    segment: newSegment,
    obstacles = []
  }) {
    const segments = [
      ...obstacles,
      _seg(...this.borderSegments.top),
      _seg(...this.borderSegments.right),
      _seg(...this.borderSegments.bottom),
      _seg(...this.borderSegments.left),
      ...this.segments,
    ];
    let count = -1;
    let max = segments.length - 1;
    let touched = [];
    let crossed = [];
    let equal = [];

    for (let i = 0; i < max; i++) {
      let segment  = segments[i];
      if(i === max) return false;
      const { isCrossed, isTouched, isEqual, dX, dY } = testCrossingLines(newSegment, segment);
      // console.log(isCrossed, isTouched, isEqual);

      if(isCrossed) crossed.push(i);
      if(isTouched) touched.push(i);
      if(isEqual) equal.push(i);
    }
    if(crossed.length > 0) return true;
    if(equal.length > 0) return true;
    if(touched.length > 0) return true;
    return false;
  }

  changeDeg (exclude) {
    let arr = this.degVariants.filter(itm => itm !== exclude);
    this.deg = rndFromArray(arr);
  }

  get maxX() { return this.borderX + this.borderWidth; }
  get maxY() { return this.borderY + this.borderHeight; }
  get minX() { return this.borderX; }
  get minY() { return this.borderY; }
  get allSegments() { return this.segments.map(item => removeProperty('stroke')(item)); }
  get borderSegments() {
    return {
      top: [this.minX, this.minY, this.maxX, this.minY],
      bottom: [this.minX, this.maxY, this.maxX, this.maxY],
      left: [this.minX, this.minY, this.minX, this.maxY],
      right: [this.maxX, this.minY, this.maxX, this.maxY]
    };
  }
  get direction() {
    if([0, -360, 360].some(d => d === this.deg)) return 'top';
    if([-270, 90].some(d => d === this.deg)) return 'right';
    if([-180, 180].some(d => d === this.deg)) return 'bottom';
    if([-90, 270].some(d => d === this.deg)) return 'left';
  }
  get oldDirection() {
    if([0, -360, 360].some(d => d === this.oldDeg)) return 'top';
    if([-270, 90].some(d => d === this.oldDeg)) return 'right';
    if([-180, 180].some(d => d === this.oldDeg)) return 'bottom';
    if([-90, 270].some(d => d === this.oldDeg)) return 'left';
  }
  get isGoingBack () {
    if(this.deg >= 0) return degGuard(this.deg + 180) === this.oldDeg;
  }
  get initPosition() {
    if(this.lastSegment) return this.lastSegment;
    this.changeDeg(-1);
    let _xv1 = int(this.borderX + (this.borderWidth - this.length) / 2) - int(this.borderWidth / 2);
    let _xv2 = int(this.borderX + (this.borderWidth - this.length) / 2) + int(this.borderWidth / 2);
    let _yv1 = int(this.borderY + (this.borderHeight - this.length) / 2) - int(this.borderHeight / 2);
    let _yv2 = int(this.borderY + (this.borderHeight - this.length) / 2) + int(this.borderHeight / 2);
    let x1 = rndMinMaxInt( _xv1, _xv2 );
    let y1 = rndMinMaxInt( _yv1, _yv2 );
    x1 = x1 - x1 % this.length;
    y1 = y1 - y1 % this.length;
    let newSegment = getRelativeLine({
      x: x1,
      y: y1,
      deg: this.deg,
      length: this.length
    });

    return {...newSegment, stroke: this.stroke};
  }

  drawWorm() {
    for (let segment of this.segments) {
      if(this.isVisSegemntsEnd) {
        strokeWeight(5)
        stroke('rgba(0,0,255,0.1)');
        point(segment.x1, segment.y1);
        point(segment.x2, segment.y2);
        strokeWeight(1)
      }
      stroke(getStroke(segment));
      line(...getLine(segment));
    }
  }

  render() {
    this.drawWorm();
  }

}
