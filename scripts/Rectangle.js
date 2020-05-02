/** Rectangle Class */
export class Rectangle {
    /**
     * @param {number} x - the x position
     * @param {number} y - the y position
     * @param {number} width - the rectangle width
     * @param {number} height - the rectangle height
     */
    constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.right = this.x + this.width;
            this.bottom = this.y + this.height;
        }
        /**
         * set the rectangles position
         * @param {number} x - the new x position
         * @param {number} y - the new y position
         */
    setPosition(x, y) {
            this.x = x;
            this.y = y;
        }
        /**
         * set the rectangles size
         * @param {number} width - the new rectangle width
         * @param {number} height - the new rectangle height
         */
    setSize(width, height) {
            this.width = width;
            this.height = height;
        }
        /**
         * check if this rectangle overlaps another rectangle
         * @param {Rectangle} rect - the rectangle to check against
         * @return {boolean} - is this rectangle overlapping the rect
         */
    overlaps(rect) {
            return (
                this.x < rect.right &&
                this.right > rect.x &&
                this.y < rect.bottom &&
                this.bottom > rect.y
            );
        }
        /**
         * check if this rectangle is inside another rectangle
         * @param {Rectangle} rect - the rect to check against
         * @return {boolean} - is this rectangle inside the rect
         */
    within(rect) {
            return (
                rect.x >= this.x &&
                rect.right <= this.right &&
                rect.y <= this.y &&
                rect.bottom >= this.bottom
            );
        }
        /**
         * check if coordinates are inside this rectangle
         * @param {number} x - the x position to check
         * @param {number} y - the y position to check
         */
    contains(x, y) {
        return (
            x >= this.x &&
            x <= this.right &&
            y >= this.y &&
            y <= this.bottom
        );
    }
}