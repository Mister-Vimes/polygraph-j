class PieGraph {
    graphName: string
    cats: Array<Category>
    maximum: number
    id: string
    centerX: number
    centerY: number
    rotation: number
    graphSize: number
    smoothness: number
    polygons: Array<Polygon[]>
    layers: Layer[]
    layerKeys: number[]    
    layerFocus: number
    locked: boolean
    dataExport: string
    constructor(id: string, graphName: string, init_cats: number, maximum: number, centerX: number, centerY: number, rotation: number, graphSize: number, smoothness: number) {
        this.id = id;
        this.graphName = graphName;
        this.layers = [];
        this.layerKeys = [];
        this.addLayer(255, 0, 0, 50);  // Starting layer
        this.cats = [];
        for (var i: number = 0; i < init_cats; i++) {
            this.addCat();
        }
        this.maximum = maximum, this.id = graphName;
        this.setMaximum(this.maximum);
        this.centerX = centerX, this.centerY = centerY, this.rotation = rotation, this.graphSize = graphSize, this.smoothness = smoothness, this.polygons = [[]], this.locked = false;

        let colors: Color[] = this.generateColors();
        for (let c: number = 0; c < colors.length; c++) {
            let r: number = colors[c].r, g: number = colors[c].g, b: number = colors[c].b;
            let colorDiv: HTMLElement = document.createElement("div");
            colorDiv.classList.add("color");
            colorDiv.style.background = "rgba(" + r + ", " + g +  ", " + b + ")";
            colorDiv.onclick = ((r: number, g: number, b: number) => {
                const layer: number = this.layerKeys[this.layerFocus];
                this.layers[layer].changeColor(r, g, b, this.layerFocus);
                document.getElementById("color-picker").style.display = "none";
                document.getElementById("color-catcher").style.display = "none";
            }).bind(this, r, g, b);
            document.getElementById("color-picker").appendChild(colorDiv);
        }
        document.getElementById("add-layer").onclick = () => {
            this.addLayer(255, 0, 0, 50);
        };
        if (document.getElementById("add-cat")) {
            document.getElementById("add-cat").onclick = () => {
                this.addCat();
            };
        }
        let exportFile: HTMLLinkElement = <HTMLLinkElement> document.getElementById("export");
        if (exportFile) {
            exportFile.onclick = () => {
                exportFile.href = this.dataExport;
            };
        }
        document.querySelectorAll("input[type=checkbox]")
            .forEach(element => element.addEventListener("change", (() => this.drawGraph())));

        document.querySelectorAll(".main-control input[type=text]")
            .forEach(element => {
                element.addEventListener("input", () => {
                    this.maximum = this.updateSelf().maximum;
                    this.drawGraph();
                });
            });

        this.drawGraph();
    }
    setMaximum(maximum: number): void {
        this.maximum = maximum;
    }
    drawGraph(): void {
        if(!this.locked) {
            this.locked = true;
            let scale = (this.maximum == 0)? 0 : this.graphSize / this.maximum;
            let canvas = document.getElementById(this.id) as HTMLCanvasElement;
            let graph = canvas.getContext("2d");

            if (graph != null) {

                graph.clearRect(0, 0, canvas.width, canvas.height);
                graph.fillStyle = "rgb(255, 255, 255)";
                graph.fillRect(0, 0, canvas.width, canvas.height);

                this.maximum = this.updateSelf().maximum;
                let mains: MainControls = this.collectMains();

                let cats_total: number = 0;

                // cats sizing
                for (let c:number = 0; c < this.cats.length; c++){
                    let catSize: HTMLInputElement = (<HTMLInputElement> document.getElementById("cat-size-" + c));
                    catSize.value = this.sanitize(catSize.value, true, [0]);
                    const num: number = Number(catSize.value);
                    let cat: Category = this.cats[c];                    
                    cat.resize(num);
                    cats_total += num;
                    cat.cleanValues(c, this.layerKeys);
                }

                let cats_tracker: number = this.rotation;

                // cats drawing, plus polygon collection for blending
                for (let i:number = 0; i < this.cats.length; i++){
                    let cat: Category = this.cats[i];
                    this.polygons = [[]];
                    
                    for (let l: number = 0; l < this.layers.length; l++) {

                        let value: number = Math.min(cat.values[l], this.maximum);
                        let values: number[] = new Array(this.smoothness).fill(value);
                        values[0] = (value + Math.min(this.maximum, this.cats[(this.cats.length + i - 1) % this.cats.length].values[l])) / 2;
                        values[this.smoothness - 1] = (value + Math.min(this.maximum, this.cats[(i + 1) % this.cats.length].values[l])) / 2;

                        let polygon: Polygon = {
                            layers: 1,
                            points: this.layers[l].calculatePoints(values, cat, cats_tracker, (cat.size / cats_total * 2 * Math.PI / (this.smoothness - 1)), scale, this.smoothness, this.centerX, this.centerY),
                            color: this.layers[l].color,
                            blend: this.layers[l].blend
                        }

                        this.polygons[0].push(polygon);

                        // Draw category basic layer
                        graph.fillStyle = "rgb(" + this.layers[l].color.r + ", " + this.layers[l].color.g + ", " + this.layers[l].color.b + ")";
                        graph.beginPath();
                        graph.moveTo(this.centerX, this.centerY);
                        polygon.points.forEach((point) => {
                            graph.lineTo(point.x, point.y);
                        });
                        graph.lineTo(this.centerX, this.centerY);
                        graph.fill();
                    }

                    // polygon blending
                    this.blendPolygons();

                    // fill blended polygons
                    for (let i: number = 1; i < this.polygons.length; i++) {
                        let polygonArray: Polygon[] = this.polygons[i];
                        polygonArray.forEach((polygon) => {
                            graph.fillStyle = "rgb(" + polygon.color.r + ", " + polygon.color.g + ", " + polygon.color.b + ")";
                            graph.beginPath();
                            graph.moveTo(this.centerX, this.centerY);
                            polygon.points.forEach((point) => {
                                graph?.lineTo(point.x, point.y);
                            });
                            graph.lineTo(this.centerX, this.centerY);
                            graph.fill();
                        });                    
                    }
                        
                    // Draw category line
                    let point: Point = cat.angleToPlot(cats_tracker, this.graphSize, this.centerX, this.centerY);
                    graph.beginPath();
                    graph.moveTo(this.centerX, this.centerY);
                    graph.lineTo(point.x, point.y);
                    graph.stroke();

                    // Category labels
                    graph.fillStyle = "rgb(0, 0, 0)";
                    graph.font = "16px sans-serif";
                    let catTitleWidth: number = graph.measureText(cat.name).width                  
                    point = cat.angleToPlot(cats_tracker + (cat.size / cats_total * Math.PI), this.graphSize * .8, this.centerX, this.centerY);
                    let push: number = Math.abs(point.y - (this.centerY - 10));
                    let target: Point = {
                        x: point.x + (((cats_tracker + (cat.size / cats_total * Math.PI)) % (2 * Math.PI) < Math.PI)? (this.graphSize * .2) + push : 
                            -(this.graphSize * .2 + push)),
                        y: point.y * .9
                    }
                    graph.beginPath();
                    graph.moveTo(point.x, point.y);
                    graph.lineTo(target.x, target.y);
                    graph.stroke();
                    if ((cats_tracker + (cat.size / cats_total * Math.PI)) % (2 * Math.PI) >= Math.PI) {
                        target.x -= catTitleWidth;
                    }
                    graph.fillText(cat.name, target.x, target.y - 5);
                    if(mains.catUnits) { 
                        let catSize: string = String(cat.size) + " " + mains.catUnits;
                        graph.font = "12px sans-serif";
                        target.x -= (graph.measureText(catSize).width - catTitleWidth);
                        graph.fillText(catSize, target.x, target.y + 7);
                    }

                    cats_tracker += cat.size / cats_total * 2 * Math.PI;
                }

                // circle, plus redraw origin line
                let point: Point = Category.prototype.angleToPlot(this.rotation, this.graphSize, this.centerX, this.centerY);
                graph.beginPath();
                graph.arc(this.centerX, this.centerY, this.graphSize, 0, 2 * Math.PI);
                graph.moveTo(this.centerX, this.centerY);
                graph.lineTo(point.x, point.y);
                graph.stroke();

                // Title text
                graph.fillStyle = "rgb(0, 0, 0)";
                graph.font = "48px sans-serif";
                let textX: number = this.centerX - (graph.measureText(this.graphName).width / 2);
                graph.fillText(this.graphName, textX, 60);

                // Layer labels

                let labelX: number = 2 * this.centerX, labelY: number = 90;
                graph.font = "14px sans-serif";

                for (const l of this.layerKeys.filter(layer => layer >= 0)) {
                    graph.fillStyle = "rgb(" + this.layers[l].color.r + ", " + this.layers[l].color.g + ", " + this.layers[l].color.b + ")";
                    graph.fillRect(labelX, labelY + (24 * l), 15, 15);
                    graph.strokeRect(labelX, labelY + (24 * l), 15, 15);
                    graph.fillStyle = "rgb(0, 0, 0)";
                    graph.fillText(this.layers[l].name, labelX + 20, labelY + (24 * l) + 13);
                }
            }
            this.dataExport = canvas.toDataURL("image/png", 1.0);
            this.locked = false;
        }
    }
    updateSelf(this: PieGraph): PieGraph {
        let mains: MainControls = this.collectMains();
        this.graphName = mains.title, this.maximum = mains.maximum;
        this.rotation = mains.rotation / 360 * 2 * Math.PI;
        return this;
    }
    collectMains(): MainControls {
        let mains: Object = {};
        let data: Array<any> = [
            ["title", "graph-title", false],
            ["maximum", "maximum", true, [0]],
            ["catUnits", "cat-units", false],
            ["layerUnits", "layer-units", false],
            ["rotation", "rotation", true, [0, 360]]
        ];
        data.forEach(arr => {
            let element: HTMLInputElement = <HTMLInputElement> document.getElementById(arr[1]);
            if (element) {
                let clean: string = this.sanitize((element.value)? element.value : "",
                    arr[2], (arr.length > 3)? arr[3] : null);
                mains[arr[0]] = (arr[2])? Number(clean) : clean;
            } else {
                mains[arr[0]] = (arr[2])? Number(arr[0]) : arr[0];
            }
        });

        return <MainControls> mains;
    }
    blendPolygons(): void {
        let depth: number = 0;
        while (depth < this.layers.length - 1) {
            while (this.polygons.length < depth + 2) {
                this.polygons.push([]);
            }
            let chunk: number = 0;
            while (chunk < this.polygons[depth].length) {
                let l: number = chunk + depth + 1;
                while (l < this.layers.length) {
                        let polygonA: Polygon = this.polygons[depth][chunk], polygonB: Polygon = this.polygons[0][l];
                        let polygon: Polygon = {
                            layers: depth + 2,
                            points: this.findNewCurve(polygonA, polygonB),
                            color: this.findNewColor(polygonA, polygonB),
                            blend: ((polygonA.blend * polygonA.layers) + polygonB.blend) / (polygonA.layers + 1)
                        }
                        this.polygons[depth + 1].push(polygon);
                    l++;
                }
                chunk++; 
            }
            depth++;
        }
    }
    findNewCurve(polygonA: Polygon, polygonB: Polygon): Array<Point> {
        let points: Point[] = [];
        if (polygonA.points.length < this.smoothness || polygonB.points.length < this.smoothness) { return points; }
        for (let i: number = 0; i < this.smoothness; i++) {
        points.push((Math.pow(polygonA.points[i].x - this.centerX, 2) + Math.pow(polygonA.points[i].y - this.centerY, 2) <
            Math.pow(polygonB.points[i].x - this.centerX, 2) + Math.pow(polygonB.points[i].y - this.centerY, 2))?
            polygonA.points[i] : polygonB.points[i]);
        }
        return points;
    }
    findNewColor(polygonA: Polygon, polygonB: Polygon): Color{
        let color: Color = {
            r: 0,
            g: 0,
            b: 0
        };

        ['r', 'g', 'b'].forEach((col) => {
            color[col] = ((polygonA.color[col] * polygonA.layers * polygonA.blend) +
                (polygonB.color[col] * polygonB.layers * polygonB.blend))
                / ((polygonA.layers * polygonA.blend) + (polygonB.layers * polygonB.blend));
        });
        return color;
    }
    // controls functionality
    addLayer(r: number, g: number, b: number, blend: number): void {
        if (this.layers.length > 7) { return; }
        let layerNum: number = this.layerKeys.length;

        // Controls
        let layerLabelCont: HTMLElement = document.createElement("div");
        layerLabelCont.id = "layer-cont-" + layerNum;
        layerLabelCont.classList.add("layer-cont");

        let layerLabel: HTMLInputElement = document.createElement("input");
        layerLabel.setAttribute("type", "text");
        layerLabel.value = "Layer " + (layerNum + 1);
        layerLabel.classList.add("cat-width", "layer-label");
        layerLabel.id = "layer-" + layerNum;
        layerLabel.oninput = ((k: number) => {
            let l: number = this.layerKeys[k];
            this.layers[l].name = this.sanitize(layerLabel.value, false);
            for (let c: number = 0; c < this.cats.length; c++) {
                this.labelNode(c, k);
            }
        }).bind(this, layerNum);
        layerLabelCont.appendChild(layerLabel);

        // Color
        let layerColor: HTMLElement = document.createElement("div");
        layerColor.classList.add("color", "layer-color");
        layerColor.id = "layer-color-" + layerNum;
        layerColor.style.background = "rgba(" + r + ", " + g + ", " + b + ")";
        layerColor.onclick = ((layerNum: number) => {
            this.layerFocus = layerNum;
            document.getElementById("color-catcher").style.display = "block";
            document.getElementById("color-picker").style.display = "block";
        }).bind(this, layerNum);
        layerLabelCont.appendChild(layerColor);

        // Blend
        let blendLabel: HTMLElement = document.createElement("label");
        blendLabel.classList.add("blend-label");
        blendLabel.id = "blend-label-" + layerNum;
        blendLabel.setAttribute("for", "blend-" + layerNum);
        blendLabel.innerHTML = "Blend level<br />(0 - 100)";
        layerLabelCont.appendChild(blendLabel);

        let blendInput: HTMLInputElement = document.createElement("input");
        blendInput.setAttribute("type", "text");
        blendInput.classList.add("blend-input");
        blendInput.id = "blend-" + layerNum;
        blendInput.value = "50";
        let blendFunction = (blendInput: HTMLInputElement, layerNum: number) => {
            blendInput.value = this.sanitize((<HTMLInputElement> document.getElementById("blend-" + layerNum)).value, true, [1, 100]);
            this.layers[this.layerKeys[layerNum]].blend = Number(blendInput.value);
            this.drawGraph();
        };
        blendInput.onkeyup = (blendFunction).bind(this, blendInput, layerNum);
        blendInput.onchange = (blendFunction).bind(this, blendInput, layerNum);
        layerLabelCont.appendChild(blendInput);

        document.getElementById("layer-sidebar").appendChild(layerLabelCont);

        // Category Space
        let catRow: HTMLElement = document.createElement("div");
        catRow.classList.add("cat-row");
        catRow.id = "cat-row-" + layerNum;

        let removeButton: HTMLElement = document.createElement("div");
        removeButton.classList.add("controls-button", "remove-layer-button");
        removeButton.innerHTML = "Remove This Layer";
        removeButton.onclick = ((layerNum: number) => {
            this.removeLayer(layerNum);
        }).bind(this, layerNum);
        catRow.appendChild(removeButton);

        document.getElementById("category-space").appendChild(catRow);
        this.layerKeys.push(this.layers.length);
        this.layers.push(new Layer(r, g, b, blend, this));
        if (this.cats) {
            this.fillLayers();
        }
    }
    addCat(): void {
        let catLabelCont: HTMLElement = document.createElement("div");
        catLabelCont.classList.add("category-label-cont");

        let catLabel: HTMLInputElement = document.createElement("input");
        catLabel.setAttribute("type", "text");
        catLabel.setAttribute("cat-num", String(this.cats.length));
        catLabel.value = "Category " + (this.cats.length + 1);
        catLabel.id = "category-input-" + this.cats.length;
        catLabel.classList.add("category-label", "cat-width");
        catLabel.oninput = ((catLabel: HTMLInputElement) => {
            let c: number = Number(catLabel.getAttribute("cat-num"));
            this.cats[c].name = this.sanitize(catLabel.value, false);
            for (let k: number = 0; k < this.layerKeys.length; k++) {
                if (this.layerKeys[k] >= 0) {
                    this.labelNode(c, k);
                }
            }
        }).bind(this, catLabel);
        catLabelCont.appendChild(catLabel);

        let catSizeLabel: HTMLElement = document.createElement("div");
        catSizeLabel.classList.add("cat-size-label");
        catSizeLabel.innerHTML = "Size:";
        catLabelCont.appendChild(catSizeLabel);

        let catSize: HTMLInputElement = document.createElement("input");
        catSize.setAttribute("type", "text");
        catSize.classList.add("cat-size");
        catSize.id = "cat-size-" + this.cats.length;
        catSize.value = "1";
        catSize.onkeyup = (() => this.drawGraph());
        catSize.onchange = (() => this.drawGraph());
        catLabelCont.appendChild(catSize);

        document.getElementById("category-labels-cont").appendChild(catLabelCont);

        let removeCat: HTMLElement = document.createElement("div");
        removeCat.classList.add("controls-button", "remove-cat-button");
        removeCat.innerHTML = "Remove This Category";
        removeCat.onclick = ((c: number) => {
            this.removeCat(c);
        }).bind(this, this.cats.length);
        // document.getElementById("remove-cats-row").appendChild(removeCat);

        this.cats.push(new Category(this.layers, this.centerX, this.centerY, this.cats.length));

        this.fillLayers();
    }
    fillLayers(): void {
        for (let k: number = 0; k < this.layerKeys.length; k++) {
            if (this.layerKeys[k] >= 0) {
                const l: number = this.layerKeys[k];
                for (let c: number = 0; c < this.cats.length; c++) {
                    while (this.cats[c].raw_vals.length < l) {
                        this.cats[c].raw_vals.push(0);
                    }
                    while (this.cats[c].values.length < l) {
                        this.cats[c].values.push(0);
                    }
                    if (!document.getElementById("data-" + c + "-" + k)) {
                        let catRow: HTMLElement = document.getElementById("cat-row-" + k);
                        catRow.appendChild(this.addNode(c, k));
                    }
                }
                let c = this.cats.length;
                while (document.getElementById("data-" + c + "-" + k)) {
                    let div = document.getElementById("data-" + c + "-" + k);
                    this.removeNodes(div);
                    c++;
                }                
            } else {
                let div = document.getElementById("cat-row-" + k);
                if (div) { this.removeNodes(div);}
            }
        }
    }
    addNode(c: number, k: number): HTMLElement {
        let l: number = this.layerKeys[k];
        let catNodeCont: HTMLElement = document.createElement("div");
        catNodeCont.classList.add("cat-node");

        let catNodeLabel: HTMLElement = document.createElement("label");
        catNodeLabel.classList.add("node-label");
        catNodeLabel.id = "node-label-" + c + "-" + k;
        catNodeLabel.setAttribute("for", "data-" + c + "-" + k);
        catNodeLabel.innerHTML = this.labelNode(c, k);

        let catNode: HTMLInputElement = document.createElement("input");
        catNode.classList.add("cat-width", "node-input");
        catNode.setAttribute("type", "text");
        catNode.value = "0";
        let inputFunction = (catNode: HTMLInputElement) => {
            catNode.value = this.sanitize(catNode.value, true);
            this.drawGraph();
        };
        catNode.onkeyup = (inputFunction).bind(this, catNode);
        catNode.onchange = (inputFunction).bind(this, catNode);
        catNode.id = ("data-" + c + "-" + k);
        catNodeCont.appendChild(catNodeLabel);
        catNodeCont.appendChild(catNode);
        return catNodeCont;
    }
    labelNode(c: number, k: number): string {
        let catNodeLabel: HTMLElement = document.getElementById("node-label-" + c + "-" + k);
        let label = this.layers[this.layerKeys[k]].name + " at " + this.cats[c].name;
        if (catNodeLabel) {       
            catNodeLabel.innerHTML = label;
        }
        return label;
    }
    removeLayer(layerNum: number): void {
        let layer: number = this.layerKeys[layerNum];
        this.layers.splice(layer, 1);
        this.cats.forEach((cat) => {
            cat.raw_vals.splice(layer, 1);
            cat.values.splice(layer, 1);
        })
        if(document.getElementById("cat-row-" + layerNum)) {
            this.removeNodes(document.getElementById("cat-row-" + layerNum));
        }
        if(document.getElementById("layer-cont-" + layerNum)) {
            this.removeNodes(document.getElementById("layer-cont-" + layerNum));
        }
        this.layerKeys = this.layerKeys.slice(0, layerNum)
            .concat([-1]
            .concat((this.layerKeys.length <= layerNum + 1)? [] : 
            this.layerKeys.slice(layerNum + 1).map((num) => {return num - 1;})));
        this.drawGraph();
    }
    removeCat(c: number): void {

    }
    removeNodes(div: HTMLElement | HTMLInputElement | ChildNode): void {
        if (div){
            while (div.firstChild) {
               this.removeNodes(div.firstChild);
            }
            div.remove();
        }
    }
    sanitize(input: string, numeric: boolean, range: number[] = []): string {
        input = input.trim();
        let output: string = '';
        let decimal: boolean = false;
        let matcher: RegExp = (numeric)? /[0-9]|\./ : /[A-Z]|[a-z]|[0-9]|[$.\-\/!@\'#%&\\ ]/;
        for (let i: number = 0; i < input.length; i++){
            if (numeric && input[i] == '.') {
                if (decimal) {
                    continue;
                } else {
                    decimal = true;
                }
            }
            output += (input[i].match(matcher))? input[i] : '';
        }
        if (numeric) {
            if(range.length > 0 && range.every((n) => { return(!Number.isNaN(n))})){
                let numerical_output: number = (Number.isNaN(output))? 0 : Number(output);                
                numerical_output = Math.max(range[0], 
                    (range.length > 1)? Math.min(numerical_output, range[1]) : numerical_output);
                output = String(numerical_output);
            }
        }
        return output;
    }
    generateColors(): Color[] {
        let colors: Color[] = [];
        for (let r: number = 2; r >= 0; r--) {
            for (let g: number = 2; g >= 0; g--) {
                for (let b: number = 2; b >= 0; b--) {
                    colors.push({
                        r: Math.round(r / 2 * 255),
                        g: Math.round(g / 2 * 255),
                        b: Math.round(b / 2 * 255)
                    })
                }
            }
        }
        return colors;
    }
}

class Category {
    name: string
    size: number
    raw_vals: Array<number>  // Pre size-adjustment
    values: Array<number>
    layers: Layer[]
    centerX: number
    centerY: number
    constructor(layers: Layer[], centerX: number, centerY: number, num: number) {
        this.name = "Category " + (num + 1);
        this.size = 1;       
        this.raw_vals = Array(layers.length).fill(0);
        this.values = Array(layers.length).fill(0);
        this.layers = layers;
        this.centerX = centerX, this.centerY = centerY;
    }
    angleToPlot(angle: number, distance: number, centerX: number, centerY: number): Point {
        let x = Math.round(Math.sin(angle) * distance) + centerX;
        let y = -Math.round(Math.cos(angle) * distance) + centerY;
        return {x: x, y: y};
    }
    cleanValues(c: number, layerKeys: number[]): void {
        for (let k: number = 0; k < layerKeys.length; k++) {
            if (layerKeys[k] >= 0) {
                let l: number = layerKeys[k];
                let val: number = ((<HTMLInputElement> document.getElementById("data-" + c + "-" + k)).value)? 
                Number((<HTMLInputElement> document.getElementById("data-" + c + "-" + k)).value) : 0;
                this.raw_vals[l] = (Number.isNaN(val) || val < 0)? 0 : val;
                this.values[l] = ((<HTMLInputElement> document.getElementById("graph-average")).checked)?
                this.raw_vals[l] / this.size : this.raw_vals[l];
            }
        }
    }
    resize(size: number): void {
        this.size = size;
    }
}

interface Point {
    x: number
    y: number
}

class Layer {
    name: string
    color: Color
    blend: number
    graph: PieGraph
    constructor(r: number, g: number, b: number, blend: number, graph: PieGraph) {
        this.name = "Layer " + (graph.layerKeys.length);
        this.color = {
            r: r,
            g: g,
            b: b
        }
        this.blend = blend;
        this.graph = graph;
    }
    
    changeColor(r: number, g: number, b:number, layerNum: number): void {
        this.color.r = r, this.color.g = g, this.color.b = b;
        document.getElementById("layer-color-" + layerNum).style.background = "rgba(" + r + ", " + g +  ", " + b + ")";
        this.graph.drawGraph();
    }

    calculatePoints(values: number[], cat: Category, cat_offset: number, cat_inc: number, scale: number, smoothness: number, centerX: number, centerY: number): Array<Point> {
        let midpoint: number = Math.max(1, Math.min(smoothness - 2, 
            Math.round(
                values[0] / (values[0] + values[smoothness - 1]) * smoothness
            )));
        let value: number = values[midpoint];
        let points: Array<Point> = [];
        for (let i: number = 0; i < midpoint; i++){
            values[i] = (value == 0)? 0 : 
                values[0] + 
                (value - values[0]) *
                Math.sin(Math.PI / 2 * i / midpoint);
            points.push(cat.angleToPlot(cat_offset + (cat_inc * i), values[i] * scale, centerX, centerY));
        }
        for (let i: number = midpoint; i < smoothness; i++){
            values[i] = (value == 0)? 0 :
                values[smoothness - 1] +
                (value - values[smoothness - 1]) *
                (Math.sin((Math.PI / 2 * (smoothness - 1 - i) / (smoothness - midpoint))));
            points.push(cat.angleToPlot(cat_offset + (cat_inc * i), values[i] * scale, centerX, centerY));
        }
        return points;
    }
}

interface Polygon {
    layers: number
    points: Point[]
    color: Color
    blend: number
}

interface Color {
    r: number
    g: number
    b: number
}

interface MainControls {
    title: string
    maximum: number
    catUnits: string
    layerUnits: string
    rotation: number
}

// test exports
//module.exports = PieGraph;