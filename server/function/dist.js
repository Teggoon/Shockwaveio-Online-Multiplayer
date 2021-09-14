/**
@param: first item's x position
@param: first item's y position
@param: second item's x position
@param: second item's y position
@return the distance between them on the Cartesian plane
*/
//JELAN, KEVIN, VICTORIA
module.exports = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}