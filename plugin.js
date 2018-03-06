let pieLabelsHelpers = {
    storage: (scope) => {
        scope.storage = scope.storage || {};
        return (key, value) => {
            if (value) {
                scope.storage[key] = value;
            }
            return scope.storage[key];
        }
    },
    drawText: (context, text, x, y, style) => {
        context.restore();
        context = Object.assign(context, style || {});
        let height = style.fontSize || 0;
        let width = context.measureText(text).width || 0;
        x -= width/2;
        y -= height/2;
        context.fillText(text, x, y);
        context.save();
        return context;
    },
    font: (font) => {
        let fontStr = "";
        if (typeof font == 'object'){
            fontStr = font.style
                + ' ' + font.variant
                + ' ' + font.size + (font.lineHeight ? '/' + font.lineHeight : '')
                + ' ' + font.family;
        } else {
            fontStr = '' + font;
        }
        return fontStr;
    }
}


// TODO:
// move common code into functions
// add customization (styling for labels, multiline labels)
// publish it on github?
let defaults = {
    style: {
        font: {
            style: "normal",
            size: "normal",
            lineHeight: "normal",
            weight: "normal",
            family: "",
            variant: "normal"
        },
        baseLine: "middle",
        fillStyle: "white"
    },
    formatter: (value) => value
}

let pieLabels = {
    id: 'pieLabels',
    afterUpdate: function(chart, options) {
        options = Object.assign(options, defaults);
    },
    afterDatasetsDraw : function(chart, args, options) { // TODO: split into afterUpdate(chart, options) and afterDatasetsDraw(chart, args, options)
        let storage = pieLabelsHelpers.storage(this);
        let doughnutCenter = {};
        chart.boxes.forEach(chartElement => {
            if (chartElement.legendHitBoxes.length != 0){
                // TODO: code below works only with legends with position 'bottom'
                doughnutCenter.y = Math.round((chartElement.chart.height - chartElement.height)/2);
                doughnutCenter.x = Math.round(chartElement.left + chartElement.width/2);
            }
        })
        let width = chart.chart.width;
        let context = chart.chart.ctx;
        let fontSize = Math.round(width / 20);
        let value = options.formatter(options.total, options.formatter);
        if (!(value && (value.value && value.suffix))) {
            return;
        }
        let text = value.value;
        let textX = Math.round(doughnutCenter.x - (context.measureText(text).width/2));
        let textY = (doughnutCenter.y - fontSize/2.5);
        let style = {
            font: "bold " + fontSize + "px montserrat,arial,sans-serif",
            baseLine: "middle",
            fillStyle: "#232c40"
        }
        pieLabelsHelpers.drawText(context, text, textX, textY, style);
        style.font = "lighter " + Math.round(fontSize*0.75) + "px montserrat,arial,sans-serif";
        text = value.suffix;
        textX = Math.round(doughnutCenter.x - (context.measureText(text).width/2));
        textY = (doughnutCenter.y + fontSize/2.5);
        pieLabelsHelpers.drawText(context, text, textX, textY, style);
        options.total = 0;
    },
    afterDatasetUpdate: function(chart, datasetInfo, options) {
        let context = chart.chart.ctx;
        let meta = datasetInfo.meta.data;
        let total = chart.config.data.datasets[datasetInfo.index].data.reduce((sum, elem)=>(sum+elem));
        options.total = options.total || 0;
        options.total += total;
        meta.forEach(element => {
            let value = chart.config.data.datasets[element._datasetIndex].data[element._index];
            element.label = {
                text: value
            }
        });
    },
    beforeDatasetDraw: function(chart, datasetInfo, options) {
        let context = chart.chart.ctx;
        let meta = datasetInfo.meta.data;
        meta.forEach(element => {
            let view = element._view;
            let angle = view.startAngle + (view.endAngle - view.startAngle)/2;
            let radius = view.innerRadius + (view.outerRadius - view.innerRadius)/2;
            let x = view.x + (Math.cos(angle)*radius);
            let y = view.y + (Math.sin(angle)*radius);
            element.label.x = x;
            element.label.y = y;
        });
    },
    afterDatasetDraw: function(chart, datasetInfo, options) {
        let context = chart.chart.ctx;
        let meta = datasetInfo.meta.data;
        let style = {
            font: "bold 10px montserrat,arial,sans-serif",
            baseLine: "middle",
            fillStyle: "#232c40"
        }
        meta.forEach(element => {
            pieLabelsHelpers.drawText(context, element.label.text, element.label.x, element.label.y, style);
        });
    }
};

Chart.plugins.register(pieLabels);