var pieGraph;
// Buildout
var init = function () {
    // Parameters
    var maximum = 125; // maximum size of graph (in units), pre-data
    var rotation = 0; // rotation of graph
    var smoothness = 121; // smoothness of drawn edges
    var centerX = 475;
    var centerY = 350;
    var graphSize = 240; // radius in px
    var init_cats = 3; // number of categories at start
    pieGraph = new PieGraph("pieGraph", "pieGraph", init_cats, maximum, centerX, centerY, rotation, graphSize, smoothness);
};
window.onload = init;
