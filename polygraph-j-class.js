var PieGraph = /** @class */ (function () {
    function PieGraph(id, graphName, init_cats, maximum, centerX, centerY, rotation, graphSize, smoothness) {
        var _this = this;
        this.id = id;
        this.graphName = graphName;
        this.layers = [];
        this.layerKeys = [];
        this.addLayer(255, 0, 0, 50); // Starting layer
        this.cats = [];
        for (var i = 0; i < init_cats; i++) {
            this.addCat();
        }
        this.maximum = maximum, this.id = graphName;
        this.setMaximum(this.maximum);
        this.centerX = centerX, this.centerY = centerY, this.rotation = rotation, this.graphSize = graphSize, this.smoothness = smoothness, this.polygons = [[]], this.locked = false;
        var colors = this.generateColors();
        for (var c = 0; c < colors.length; c++) {
            var r = colors[c].r, g = colors[c].g, b = colors[c].b;
            var colorDiv = document.createElement("div");
            colorDiv.classList.add("color");
            colorDiv.style.background = "rgba(" + r + ", " + g + ", " + b + ")";
            colorDiv.onclick = (function (r, g, b) {
                var layer = _this.layerKeys[_this.layerFocus];
                _this.layers[layer].changeColor(r, g, b, _this.layerFocus);
                document.getElementById("color-picker").style.display = "none";
                document.getElementById("color-catcher").style.display = "none";
            }).bind(this, r, g, b);
            document.getElementById("color-picker").appendChild(colorDiv);
        }
        document.getElementById("add-layer").onclick = function () {
            _this.addLayer(255, 0, 0, 50);
        };
        if (document.getElementById("add-cat")) {
            document.getElementById("add-cat").onclick = function () {
                _this.addCat();
            };
        }
        var exportFile = document.getElementById("export");
        if (exportFile) {
            exportFile.onclick = function () {
                exportFile.href = _this.dataExport;
            };
        }
        document.querySelectorAll("input[type=checkbox]")
            .forEach(function (element) { return element.addEventListener("change", (function () { return _this.drawGraph(); })); });
        document.querySelectorAll(".main-control input[type=text]")
            .forEach(function (element) {
            element.addEventListener("input", function () {
                _this.maximum = _this.updateSelf().maximum;
                _this.drawGraph();
            });
        });
        this.drawGraph();
    }
    PieGraph.prototype.setMaximum = function (maximum) {
        this.maximum = maximum;
    };
    PieGraph.prototype.drawGraph = function () {
        var _this = this;
        if (!this.locked) {
            this.locked = true;
            var scale = (this.maximum == 0) ? 0 : this.graphSize / this.maximum;
            var canvas = document.getElementById(this.id);
            var graph_1 = canvas.getContext("2d");
            if (graph_1 != null) {
                graph_1.clearRect(0, 0, canvas.width, canvas.height);
                graph_1.fillStyle = "rgb(255, 255, 255)";
                graph_1.fillRect(0, 0, canvas.width, canvas.height);
                this.maximum = this.updateSelf().maximum;
                var mains = this.collectMains();
                var cats_total = 0;
                // cats sizing
                for (var c = 0; c < this.cats.length; c++) {
                    var catSize = document.getElementById("cat-size-" + c);
                    catSize.value = this.sanitize(catSize.value, true, [0]);
                    var num = Number(catSize.value);
                    var cat = this.cats[c];
                    cat.resize(num);
                    cats_total += num;
                    cat.cleanValues(c, this.layerKeys);
                }
                var cats_tracker = this.rotation;
                // cats drawing, plus polygon collection for blending
                for (var i = 0; i < this.cats.length; i++) {
                    var cat = this.cats[i];
                    this.polygons = [[]];
                    for (var l = 0; l < this.layers.length; l++) {
                        var value = Math.min(cat.values[l], this.maximum);
                        var values = new Array(this.smoothness).fill(value);
                        values[0] = (value + Math.min(this.maximum, this.cats[(this.cats.length + i - 1) % this.cats.length].values[l])) / 2;
                        values[this.smoothness - 1] = (value + Math.min(this.maximum, this.cats[(i + 1) % this.cats.length].values[l])) / 2;
                        var polygon = {
                            layers: 1,
                            points: this.layers[l].calculatePoints(values, cat, cats_tracker, (cat.size / cats_total * 2 * Math.PI / (this.smoothness - 1)), scale, this.smoothness, this.centerX, this.centerY),
                            color: this.layers[l].color,
                            blend: this.layers[l].blend
                        };
                        this.polygons[0].push(polygon);
                        // Draw category basic layer
                        graph_1.fillStyle = "rgb(" + this.layers[l].color.r + ", " + this.layers[l].color.g + ", " + this.layers[l].color.b + ")";
                        graph_1.beginPath();
                        graph_1.moveTo(this.centerX, this.centerY);
                        polygon.points.forEach(function (point) {
                            graph_1.lineTo(point.x, point.y);
                        });
                        graph_1.lineTo(this.centerX, this.centerY);
                        graph_1.fill();
                    }
                    // polygon blending
                    this.blendPolygons();
                    // fill blended polygons
                    for (var i_1 = 1; i_1 < this.polygons.length; i_1++) {
                        var polygonArray = this.polygons[i_1];
                        polygonArray.forEach(function (polygon) {
                            graph_1.fillStyle = "rgb(" + polygon.color.r + ", " + polygon.color.g + ", " + polygon.color.b + ")";
                            graph_1.beginPath();
                            graph_1.moveTo(_this.centerX, _this.centerY);
                            polygon.points.forEach(function (point) {
                                graph_1 === null || graph_1 === void 0 ? void 0 : graph_1.lineTo(point.x, point.y);
                            });
                            graph_1.lineTo(_this.centerX, _this.centerY);
                            graph_1.fill();
                        });
                    }
                    // Draw category line
                    var point_1 = cat.angleToPlot(cats_tracker, this.graphSize, this.centerX, this.centerY);
                    graph_1.beginPath();
                    graph_1.moveTo(this.centerX, this.centerY);
                    graph_1.lineTo(point_1.x, point_1.y);
                    graph_1.stroke();
                    // Category labels
                    graph_1.fillStyle = "rgb(0, 0, 0)";
                    graph_1.font = "16px sans-serif";
                    var catTitleWidth = graph_1.measureText(cat.name).width;
                    point_1 = cat.angleToPlot(cats_tracker + (cat.size / cats_total * Math.PI), this.graphSize * .8, this.centerX, this.centerY);
                    var push = Math.abs(point_1.y - (this.centerY - 10));
                    var target = {
                        x: point_1.x + (((cats_tracker + (cat.size / cats_total * Math.PI)) % (2 * Math.PI) < Math.PI) ? (this.graphSize * .2) + push :
                            -(this.graphSize * .2 + push)),
                        y: point_1.y * .9
                    };
                    graph_1.beginPath();
                    graph_1.moveTo(point_1.x, point_1.y);
                    graph_1.lineTo(target.x, target.y);
                    graph_1.stroke();
                    if ((cats_tracker + (cat.size / cats_total * Math.PI)) % (2 * Math.PI) >= Math.PI) {
                        target.x -= catTitleWidth;
                    }
                    graph_1.fillText(cat.name, target.x, target.y - 5);
                    if (mains.catUnits) {
                        var catSize = String(cat.size) + " " + mains.catUnits;
                        graph_1.font = "12px sans-serif";
                        target.x -= (graph_1.measureText(catSize).width - catTitleWidth);
                        graph_1.fillText(catSize, target.x, target.y + 7);
                    }
                    cats_tracker += cat.size / cats_total * 2 * Math.PI;
                }
                // circle, plus redraw origin line
                var point = Category.prototype.angleToPlot(this.rotation, this.graphSize, this.centerX, this.centerY);
                graph_1.beginPath();
                graph_1.arc(this.centerX, this.centerY, this.graphSize, 0, 2 * Math.PI);
                graph_1.moveTo(this.centerX, this.centerY);
                graph_1.lineTo(point.x, point.y);
                graph_1.stroke();
                // Title text
                graph_1.fillStyle = "rgb(0, 0, 0)";
                graph_1.font = "48px sans-serif";
                var textX = this.centerX - (graph_1.measureText(this.graphName).width / 2);
                graph_1.fillText(this.graphName, textX, 60);
                // Layer labels
                var labelX = 2 * this.centerX, labelY = 90;
                graph_1.font = "14px sans-serif";
                for (var _i = 0, _a = this.layerKeys.filter(function (layer) { return layer >= 0; }); _i < _a.length; _i++) {
                    var l = _a[_i];
                    graph_1.fillStyle = "rgb(" + this.layers[l].color.r + ", " + this.layers[l].color.g + ", " + this.layers[l].color.b + ")";
                    graph_1.fillRect(labelX, labelY + (24 * l), 15, 15);
                    graph_1.strokeRect(labelX, labelY + (24 * l), 15, 15);
                    graph_1.fillStyle = "rgb(0, 0, 0)";
                    graph_1.fillText(this.layers[l].name, labelX + 20, labelY + (24 * l) + 13);
                }
            }
            this.dataExport = canvas.toDataURL("image/png", 1.0);
            this.locked = false;
        }
    };
    PieGraph.prototype.updateSelf = function () {
        var mains = this.collectMains();
        this.graphName = mains.title, this.maximum = mains.maximum;
        this.rotation = mains.rotation / 360 * 2 * Math.PI;
        return this;
    };
    PieGraph.prototype.collectMains = function () {
        var _this = this;
        var mains = {};
        var data = [
            ["title", "graph-title", false],
            ["maximum", "maximum", true, [0]],
            ["catUnits", "cat-units", false],
            ["layerUnits", "layer-units", false],
            ["rotation", "rotation", true, [0, 360]]
        ];
        data.forEach(function (arr) {
            var element = document.getElementById(arr[1]);
            if (element) {
                var clean = _this.sanitize((element.value) ? element.value : "", arr[2], (arr.length > 3) ? arr[3] : null);
                mains[arr[0]] = (arr[2]) ? Number(clean) : clean;
            }
            else {
                mains[arr[0]] = (arr[2]) ? Number(arr[0]) : arr[0];
            }
        });
        return mains;
    };
    PieGraph.prototype.blendPolygons = function () {
        var depth = 0;
        while (depth < this.layers.length - 1) {
            while (this.polygons.length < depth + 2) {
                this.polygons.push([]);
            }
            var chunk = 0;
            while (chunk < this.polygons[depth].length) {
                var l = chunk + depth + 1;
                while (l < this.layers.length) {
                    var polygonA = this.polygons[depth][chunk], polygonB = this.polygons[0][l];
                    var polygon = {
                        layers: depth + 2,
                        points: this.findNewCurve(polygonA, polygonB),
                        color: this.findNewColor(polygonA, polygonB),
                        blend: ((polygonA.blend * polygonA.layers) + polygonB.blend) / (polygonA.layers + 1)
                    };
                    this.polygons[depth + 1].push(polygon);
                    l++;
                }
                chunk++;
            }
            depth++;
        }
    };
    PieGraph.prototype.findNewCurve = function (polygonA, polygonB) {
        var points = [];
        if (polygonA.points.length < this.smoothness || polygonB.points.length < this.smoothness) {
            return points;
        }
        for (var i = 0; i < this.smoothness; i++) {
            points.push((Math.pow(polygonA.points[i].x - this.centerX, 2) + Math.pow(polygonA.points[i].y - this.centerY, 2) <
                Math.pow(polygonB.points[i].x - this.centerX, 2) + Math.pow(polygonB.points[i].y - this.centerY, 2)) ?
                polygonA.points[i] : polygonB.points[i]);
        }
        return points;
    };
    PieGraph.prototype.findNewColor = function (polygonA, polygonB) {
        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        ['r', 'g', 'b'].forEach(function (col) {
            color[col] = ((polygonA.color[col] * polygonA.layers * polygonA.blend) +
                (polygonB.color[col] * polygonB.layers * polygonB.blend))
                / ((polygonA.layers * polygonA.blend) + (polygonB.layers * polygonB.blend));
        });
        return color;
    };
    // controls functionality
    PieGraph.prototype.addLayer = function (r, g, b, blend) {
        var _this = this;
        if (this.layers.length > 7) {
            return;
        }
        var layerNum = this.layerKeys.length;
        // Controls
        var layerLabelCont = document.createElement("div");
        layerLabelCont.id = "layer-cont-" + layerNum;
        layerLabelCont.classList.add("layer-cont");
        var layerLabel = document.createElement("input");
        layerLabel.setAttribute("type", "text");
        layerLabel.value = "Layer " + (layerNum + 1);
        layerLabel.classList.add("cat-width", "layer-label");
        layerLabel.id = "layer-" + layerNum;
        layerLabel.oninput = (function (k) {
            var l = _this.layerKeys[k];
            _this.layers[l].name = _this.sanitize(layerLabel.value, false);
            for (var c = 0; c < _this.cats.length; c++) {
                _this.labelNode(c, k);
            }
        }).bind(this, layerNum);
        layerLabelCont.appendChild(layerLabel);
        // Color
        var layerColor = document.createElement("div");
        layerColor.classList.add("color", "layer-color");
        layerColor.id = "layer-color-" + layerNum;
        layerColor.style.background = "rgba(" + r + ", " + g + ", " + b + ")";
        layerColor.onclick = (function (layerNum) {
            _this.layerFocus = layerNum;
            document.getElementById("color-catcher").style.display = "block";
            document.getElementById("color-picker").style.display = "block";
        }).bind(this, layerNum);
        layerLabelCont.appendChild(layerColor);
        // Blend
        var blendLabel = document.createElement("label");
        blendLabel.classList.add("blend-label");
        blendLabel.id = "blend-label-" + layerNum;
        blendLabel.setAttribute("for", "blend-" + layerNum);
        blendLabel.innerHTML = "Blend level<br />(0 - 100)";
        layerLabelCont.appendChild(blendLabel);
        var blendInput = document.createElement("input");
        blendInput.setAttribute("type", "text");
        blendInput.classList.add("blend-input");
        blendInput.id = "blend-" + layerNum;
        blendInput.value = "50";
        var blendFunction = function (blendInput, layerNum) {
            blendInput.value = _this.sanitize(document.getElementById("blend-" + layerNum).value, true, [1, 100]);
            _this.layers[_this.layerKeys[layerNum]].blend = Number(blendInput.value);
            _this.drawGraph();
        };
        blendInput.onkeyup = (blendFunction).bind(this, blendInput, layerNum);
        blendInput.onchange = (blendFunction).bind(this, blendInput, layerNum);
        layerLabelCont.appendChild(blendInput);
        document.getElementById("layer-sidebar").appendChild(layerLabelCont);
        // Category Space
        var catRow = document.createElement("div");
        catRow.classList.add("cat-row");
        catRow.id = "cat-row-" + layerNum;
        var removeButton = document.createElement("div");
        removeButton.classList.add("controls-button", "remove-layer-button");
        removeButton.innerHTML = "Remove This Layer";
        removeButton.onclick = (function (layerNum) {
            _this.removeLayer(layerNum);
        }).bind(this, layerNum);
        catRow.appendChild(removeButton);
        document.getElementById("category-space").appendChild(catRow);
        this.layerKeys.push(this.layers.length);
        this.layers.push(new Layer(r, g, b, blend, this));
        if (this.cats) {
            this.fillLayers();
        }
    };
    PieGraph.prototype.addCat = function () {
        var _this = this;
        var catLabelCont = document.createElement("div");
        catLabelCont.classList.add("category-label-cont");
        var catLabel = document.createElement("input");
        catLabel.setAttribute("type", "text");
        catLabel.setAttribute("cat-num", String(this.cats.length));
        catLabel.value = "Category " + (this.cats.length + 1);
        catLabel.id = "category-input-" + this.cats.length;
        catLabel.classList.add("category-label", "cat-width");
        catLabel.oninput = (function (catLabel) {
            var c = Number(catLabel.getAttribute("cat-num"));
            _this.cats[c].name = _this.sanitize(catLabel.value, false);
            for (var k = 0; k < _this.layerKeys.length; k++) {
                if (_this.layerKeys[k] >= 0) {
                    _this.labelNode(c, k);
                }
            }
        }).bind(this, catLabel);
        catLabelCont.appendChild(catLabel);
        var catSizeLabel = document.createElement("div");
        catSizeLabel.classList.add("cat-size-label");
        catSizeLabel.innerHTML = "Size:";
        catLabelCont.appendChild(catSizeLabel);
        var catSize = document.createElement("input");
        catSize.setAttribute("type", "text");
        catSize.classList.add("cat-size");
        catSize.id = "cat-size-" + this.cats.length;
        catSize.value = "1";
        catSize.onkeyup = (function () { return _this.drawGraph(); });
        catSize.onchange = (function () { return _this.drawGraph(); });
        catLabelCont.appendChild(catSize);
        document.getElementById("category-labels-cont").appendChild(catLabelCont);
        var removeCat = document.createElement("div");
        removeCat.classList.add("controls-button", "remove-cat-button");
        removeCat.innerHTML = "Remove This Category";
        removeCat.onclick = (function (c) {
            _this.removeCat(c);
        }).bind(this, this.cats.length);
        // document.getElementById("remove-cats-row").appendChild(removeCat);
        this.cats.push(new Category(this.layers, this.centerX, this.centerY, this.cats.length));
        this.fillLayers();
    };
    PieGraph.prototype.fillLayers = function () {
        for (var k = 0; k < this.layerKeys.length; k++) {
            if (this.layerKeys[k] >= 0) {
                var l = this.layerKeys[k];
                for (var c_1 = 0; c_1 < this.cats.length; c_1++) {
                    while (this.cats[c_1].raw_vals.length < l) {
                        this.cats[c_1].raw_vals.push(0);
                    }
                    while (this.cats[c_1].values.length < l) {
                        this.cats[c_1].values.push(0);
                    }
                    if (!document.getElementById("data-" + c_1 + "-" + k)) {
                        var catRow = document.getElementById("cat-row-" + k);
                        catRow.appendChild(this.addNode(c_1, k));
                    }
                }
                var c = this.cats.length;
                while (document.getElementById("data-" + c + "-" + k)) {
                    var div = document.getElementById("data-" + c + "-" + k);
                    this.removeNodes(div);
                    c++;
                }
            }
            else {
                var div = document.getElementById("cat-row-" + k);
                if (div) {
                    this.removeNodes(div);
                }
            }
        }
    };
    PieGraph.prototype.addNode = function (c, k) {
        var _this = this;
        var l = this.layerKeys[k];
        var catNodeCont = document.createElement("div");
        catNodeCont.classList.add("cat-node");
        var catNodeLabel = document.createElement("label");
        catNodeLabel.classList.add("node-label");
        catNodeLabel.id = "node-label-" + c + "-" + k;
        catNodeLabel.setAttribute("for", "data-" + c + "-" + k);
        catNodeLabel.innerHTML = this.labelNode(c, k);
        var catNode = document.createElement("input");
        catNode.classList.add("cat-width", "node-input");
        catNode.setAttribute("type", "text");
        catNode.value = "0";
        var inputFunction = function (catNode) {
            catNode.value = _this.sanitize(catNode.value, true);
            _this.drawGraph();
        };
        catNode.onkeyup = (inputFunction).bind(this, catNode);
        catNode.onchange = (inputFunction).bind(this, catNode);
        catNode.id = ("data-" + c + "-" + k);
        catNodeCont.appendChild(catNodeLabel);
        catNodeCont.appendChild(catNode);
        return catNodeCont;
    };
    PieGraph.prototype.labelNode = function (c, k) {
        var catNodeLabel = document.getElementById("node-label-" + c + "-" + k);
        var label = this.layers[this.layerKeys[k]].name + " at " + this.cats[c].name;
        if (catNodeLabel) {
            catNodeLabel.innerHTML = label;
        }
        return label;
    };
    PieGraph.prototype.removeLayer = function (layerNum) {
        var layer = this.layerKeys[layerNum];
        this.layers.splice(layer, 1);
        this.cats.forEach(function (cat) {
            cat.raw_vals.splice(layer, 1);
            cat.values.splice(layer, 1);
        });
        if (document.getElementById("cat-row-" + layerNum)) {
            this.removeNodes(document.getElementById("cat-row-" + layerNum));
        }
        if (document.getElementById("layer-cont-" + layerNum)) {
            this.removeNodes(document.getElementById("layer-cont-" + layerNum));
        }
        this.layerKeys = this.layerKeys.slice(0, layerNum)
            .concat([-1]
            .concat((this.layerKeys.length <= layerNum + 1) ? [] :
            this.layerKeys.slice(layerNum + 1).map(function (num) { return num - 1; })));
        this.drawGraph();
    };
    PieGraph.prototype.removeCat = function (c) {
    };
    PieGraph.prototype.removeNodes = function (div) {
        if (div) {
            while (div.firstChild) {
                this.removeNodes(div.firstChild);
            }
            div.remove();
        }
    };
    PieGraph.prototype.sanitize = function (input, numeric, range) {
        if (range === void 0) { range = []; }
        input = input.trim();
        var output = '';
        var decimal = false;
        var matcher = (numeric) ? /[0-9]|\./ : /[A-Z]|[a-z]|[0-9]|[$.\-\/!@\'#%&\\ ]/;
        for (var i = 0; i < input.length; i++) {
            if (numeric && input[i] == '.') {
                if (decimal) {
                    continue;
                }
                else {
                    decimal = true;
                }
            }
            output += (input[i].match(matcher)) ? input[i] : '';
        }
        if (numeric) {
            if (range.length > 0 && range.every(function (n) { return (!Number.isNaN(n)); })) {
                var numerical_output = (Number.isNaN(output)) ? 0 : Number(output);
                numerical_output = Math.max(range[0], (range.length > 1) ? Math.min(numerical_output, range[1]) : numerical_output);
                output = String(numerical_output);
            }
        }
        return output;
    };
    PieGraph.prototype.generateColors = function () {
        var colors = [];
        for (var r = 2; r >= 0; r--) {
            for (var g = 2; g >= 0; g--) {
                for (var b = 2; b >= 0; b--) {
                    colors.push({
                        r: Math.round(r / 2 * 255),
                        g: Math.round(g / 2 * 255),
                        b: Math.round(b / 2 * 255)
                    });
                }
            }
        }
        return colors;
    };
    return PieGraph;
}());
var Category = /** @class */ (function () {
    function Category(layers, centerX, centerY, num) {
        this.name = "Category " + (num + 1);
        this.size = 1;
        this.raw_vals = Array(layers.length).fill(0);
        this.values = Array(layers.length).fill(0);
        this.layers = layers;
        this.centerX = centerX, this.centerY = centerY;
    }
    Category.prototype.angleToPlot = function (angle, distance, centerX, centerY) {
        var x = Math.round(Math.sin(angle) * distance) + centerX;
        var y = -Math.round(Math.cos(angle) * distance) + centerY;
        return { x: x, y: y };
    };
    Category.prototype.cleanValues = function (c, layerKeys) {
        for (var k = 0; k < layerKeys.length; k++) {
            if (layerKeys[k] >= 0) {
                var l = layerKeys[k];
                var val = (document.getElementById("data-" + c + "-" + k).value) ?
                    Number(document.getElementById("data-" + c + "-" + k).value) : 0;
                this.raw_vals[l] = (Number.isNaN(val) || val < 0) ? 0 : val;
                this.values[l] = (document.getElementById("graph-average").checked) ?
                    this.raw_vals[l] / this.size : this.raw_vals[l];
            }
        }
    };
    Category.prototype.resize = function (size) {
        this.size = size;
    };
    return Category;
}());
var Layer = /** @class */ (function () {
    function Layer(r, g, b, blend, graph) {
        this.name = "Layer " + (graph.layerKeys.length);
        this.color = {
            r: r,
            g: g,
            b: b
        };
        this.blend = blend;
        this.graph = graph;
    }
    Layer.prototype.changeColor = function (r, g, b, layerNum) {
        this.color.r = r, this.color.g = g, this.color.b = b;
        document.getElementById("layer-color-" + layerNum).style.background = "rgba(" + r + ", " + g + ", " + b + ")";
        this.graph.drawGraph();
    };
    Layer.prototype.calculatePoints = function (values, cat, cat_offset, cat_inc, scale, smoothness, centerX, centerY) {
        var midpoint = Math.max(1, Math.min(smoothness - 2, Math.round(values[0] / (values[0] + values[smoothness - 1]) * smoothness)));
        var value = values[midpoint];
        var points = [];
        for (var i = 0; i < midpoint; i++) {
            values[i] = (value == 0) ? 0 :
                values[0] +
                    (value - values[0]) *
                        Math.sin(Math.PI / 2 * i / midpoint);
            points.push(cat.angleToPlot(cat_offset + (cat_inc * i), values[i] * scale, centerX, centerY));
        }
        for (var i = midpoint; i < smoothness; i++) {
            values[i] = (value == 0) ? 0 :
                values[smoothness - 1] +
                    (value - values[smoothness - 1]) *
                        (Math.sin((Math.PI / 2 * (smoothness - 1 - i) / (smoothness - midpoint))));
            points.push(cat.angleToPlot(cat_offset + (cat_inc * i), values[i] * scale, centerX, centerY));
        }
        return points;
    };
    return Layer;
}());
// test exports
//module.exports = PieGraph;
