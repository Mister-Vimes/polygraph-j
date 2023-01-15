var pieGraph: PieGraph;

// Buildout

const init = function(): void {

    // Parameters
    var maximum: number = 125; // maximum size of graph (in units), pre-data
    var rotation: number = 0;  // rotation of graph
    var smoothness: number = 121;  // smoothness of drawn edges
    var centerX: number = 475;
    var centerY: number = 350;
    var graphSize: number = 240;  // radius in px
    var init_cats = 3; // number of categories at start

    pieGraph = new PieGraph("pieGraph", "pieGraph", init_cats, maximum, centerX, centerY, rotation, graphSize, smoothness);
}

window.onload = init;