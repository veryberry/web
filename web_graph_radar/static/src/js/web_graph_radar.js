openerp.web_graph_radar = function(instance) {
    
    var _t = instance.web._t;
    
    instance.web_graph.Graph.include({
        template: 'GraphWidgetRadar',
        radar: function() {
            var self = this,
                dim_x = this.pivot.rows.groupby.length,
                dim_y = this.pivot.cols.groupby.length,
                data;

            // No groupby 
            if ((dim_x === 0) && (dim_y === 0)) {
                data = [{key: _t('Total'), values:[{
                    label: _t('Total'),
                    value: this.pivot.get_total()[0],
                }]}];
            // Only column groupbys 
            } else if ((dim_x === 0) && (dim_y >= 1)){
                data =  _.map(this.pivot.get_cols_with_depth(1), function (header) {
                    return {
                        key: header.title,
                        values: [{label:header.title, value: self.pivot.get_total(header)[0]}]
                    };
                });
            // Just 1 row groupby 
            } else if ((dim_x === 1) && (dim_y === 0))  {
                data = _.map(self.pivot.measures, function(measure, i) {
                    var series = _.map(self.pivot.main_row().children, function (pt) {
                        var value = self.pivot.get_total(pt)[i],
                        title = (pt.title !== undefined) ? pt.title : _t('Undefined');
                        return {label: title, value: value};
                    });
                    return {key: self.pivot.measures[i].string, values:series};
                });
            // 1 row groupby and some col groupbys
            } else if ((dim_x === 1) && (dim_y >= 1))  {
                data = _.map(this.pivot.get_cols_with_depth(1), function (colhdr) {
                    var values = _.map(self.pivot.get_rows_with_depth(1), function (header) {
                        return {
                            label: header.title || _t('Undefined'),
                            value: self.pivot.get_values(header.id, colhdr.id)[0] || 0
                        };
                    });
                    return {key: colhdr.title || _t('Undefined'), values: values};
                });
            // At least two row groupby
            } else {
                var keys = _.uniq(_.map(this.pivot.get_rows_with_depth(2), function (hdr) {
                    return hdr.title || _t('Undefined');
                }));
                data = _.map(keys, function (key) {
                    var values = _.map(self.pivot.get_rows_with_depth(1), function (hdr) {
                        var subhdr = _.find(hdr.children, function (child) {
                            return ((child.title === key) || ((child.title === undefined) && (key === _t('Undefined'))));
                        });
                        return {
                            label: hdr.title || _t('Undefined'),
                            value: (subhdr) ? self.pivot.get_total(subhdr)[0] : 0
                        };
                    });
                    return {key:key, values: values};
                });
            }
            nv.addGraph(function () {
                var chart = nv.models.radarChart();
                    // .stacked(self.bar_ui === 'stack')
                    // .showControls(show_controls);

                chart.margin({left:200, top:20, bottom:20});

                d3.select(self.svg)
                    .datum(data)
                    .attr('width', self.width)
                    .attr('height', self.height)
                    .call(chart);

                // nv.utils.windowResize(chart.update);
                return chart;
            });

        },
        option_selection: function (event) {
            this._super(event);
            if (event.currentTarget.getAttribute('data-choice') == 'export_png') {
                var svg = document.querySelector("svg");

                if (typeof window.XMLSerializer != "undefined") {
                    var svgData = (new XMLSerializer()).serializeToString(svg);
                } else if (typeof svg.xml != "undefined") {
                    var svgData = svg.xml;
                }

                var canvas = document.createElement("canvas");
                var svgSize = svg.getBoundingClientRect();
                canvas.width = svgSize.width;
                canvas.height = svgSize.height;
                var ctx = canvas.getContext("2d");
                //set background color
                ctx.fillStyle = 'white';
                //draw background / rect on entire canvas
                ctx.fillRect(0,0,canvas.width,canvas.height);

                var img = document.createElement("img");
                img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))) );
                img.onload = function() {
                    ctx.drawImage(img, 0, 0);
                    var imgsrc = canvas.toDataURL("image/png", 1.0);
                    var a = document.createElement("a");
                    a.download = "graph"+".png";
                    a.href = imgsrc;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                };
            }
        },
    });
}
