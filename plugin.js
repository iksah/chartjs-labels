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
        context.fillText(text, x, y);
        context.save();
        return context;
    },
    formatter: (value, formatter) => typeof formatter == 'function' ? formatter(value) : value
}


// TODO:
// move common code into functions
// add customization (styling for labels, multiline labels)
// publish it on github?
let pieLabels = {
    id: 'pieLabels',
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
        let value = pieLabelsHelpers.formatter(options.total, options.formatter);
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
        let storage = pieLabelsHelpers.storage(this);
        options.total = options.total || 0;
        options.total += total;
        meta.forEach(element => {
            let value = chart.config.data.datasets[element._datasetIndex].data[element._index];
            element.label = {
                text: value
            }
            // console.log(JSON.stringify(view));
        });
    },
    beforeDatasetDraw: function(chart, datasetInfo, options) {
        let context = chart.chart.ctx;
        let meta = datasetInfo.meta.data;
        meta.forEach(element => {
            let view = element._view;
            let angle = (view.endAngle - view.startAngle)/2;
            let radius = view.innerRadius + (view.outerRadius - view.innerRadius)/2;
            let x = view.x + (Math.cos(angle)*radius);
            let y = view.y + (Math.sin(angle)*radius);
            console.log(view.x, view.y, angle, Math.cos(angle), Math.sin(angle));
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
            console.log(element.label.text, element.label.x, element.label.y);
            pieLabelsHelpers.drawText(context, element.label.text, element.label.x, element.label.y, style);
        });
    }
};
Chart.plugins.register(pieLabels);