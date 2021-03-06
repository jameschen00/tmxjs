/*
 * Copyright 2013 Cameron McKay
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require.config({
    paths: {
        jquery: "lib/jquery",
        zlib: "lib/zlib.min",
        tmxjs: "src"
    },
    shim: {
        zlib: { exports: "Zlib" }
    }
});

require([
    "jquery",
    "tmxjs/map",
    "tmxjs/util/util"
], function (
    $,
    Map,
    U
) {
    var url = "examples/desert.tmx";
    var options = {
        dir: url.split("/").slice(0, -1) || "."
    };

    $.get(url, {}, null, "xml")
        .done(function (xml) {
            Map.fromXML(xml, options).done(function (map) {
                // Export to XML when "x" key pressed.
                $(document).on("keypress", function (event) {
                    if (String.fromCharCode(event.which) === "x") {
                        var doc = map.toXML(options);
                        console.log(doc.context);
                    }
                });

                console.log(map);
                $.each(map.tileSets, function () {
                    console.log(this);
                });

                var canvas = $("#map").css({
                    width: map.bounds.w * map.tileInfo.w,
                    height: map.bounds.h * map.tileInfo.h
                });
                var ruleSets = {};
                $.each(map.layers, function (ln, layer) {
                    $.each(layer.cells, function (tn, cell) {
                        if (!cell) return true;

                        var i = tn % layer.bounds.w;
                        var j = Math.floor(tn / layer.bounds.w);
                        var tileSet = cell.tile.tileSet;

                        var flippedClass = U.format("flipped-{0}-{1}-{2}",
                            +cell.flipped.horizontally,
                            +cell.flipped.vertically,
                            +cell.flipped.antidiagonally);
                        var classes = [
                            "tile-set",
                            "tile-set-" + tileSet.firstGlobalId,
                            "tile",
                            "tile-" + cell.tile.getGlobalId(),
                            flippedClass
                        ];

                        var format, ruleSet;
                        if (!ruleSets["tile-set-"] + tileSet.firstGlobalId) {
                            format = [
                                "background-image: url({0});"
                            ].join("/");
                            ruleSet = U.format(format, options.dir + "/" + cell.tile.imageInfo.source);
                            ruleSets["tile-set-" + tileSet.firstGlobalId] = ruleSet;
                        }
                        if (!ruleSets["tile-" + cell.tile.getGlobalId()]) {
                            format = [
                                "width: {0}px;",
                                "height: {1}px;",
                                "background-repeat: no-repeat;",
                                "background-position: {2}px {3}px;"
                            ].join(" ");
                            ruleSet = U.format(format,
                                +cell.tile.bounds.w,
                                +cell.tile.bounds.h,
                                -cell.tile.bounds.x,
                                -cell.tile.bounds.y
                            );
                            ruleSets["tile-" + cell.tile.getGlobalId()] = ruleSet;
                        }
                        if (!ruleSets[flippedClass]) {
                            var m = [1, 0, 0, 1];
                            if (cell.flipped.antidiagonally) {
                                m[0] = 0;
                                m[1] = 1;
                                m[2] = 1;
                                m[3] = 0;
                            }
                            if (cell.flipped.horizontally) {
                                m[0] = -m[0];
                                m[2] = -m[2];
                            }
                            if (cell.flipped.vertically) {
                                m[1] = -m[1];
                                m[3] = -m[3];
                            }
                            var matrix = U.format("matrix({0}, {1}, {2}, {3}, 0, 0)", m[0], m[1], m[2], m[3]);
                            var dxMatrix =  U.format(
                                "progid:DXImageTransform.Microsoft.Matrix(M11={0},M12={1},M21={2},M22={3},sizingMethod='auto expand')",
                                m[0], m[1], m[2], m[3]
                            );
                            ruleSet = [
                                "-moz-transform: " + matrix + ";",
                                "-o-transform: " + matrix + ";",
                                "-webkit-transform: " + matrix + ";",
                                "transform: " + matrix + ";",
                                '-ms-filter: "' + dxMatrix + '";',
                                "filter: " + dxMatrix + ";"
                            ].join(" ");
                            ruleSets[flippedClass] = ruleSet;
                        }

                        $("<div>", {
                            'id': 'tile-' + tn,
                            'class': classes.join(" "),
                            'style': U.format("left: {0}px; top: {1}px;",
                                i * cell.tile.bounds.w,
                                j * cell.tile.bounds.h
                            )
                        }).appendTo(canvas);

                        return true;
                    });
                });
                // Create the CSS classes.
                var styleSheet = [ ".tile { position: absolute; }" ];
                $.each(ruleSets, function (key, value) {
                    styleSheet.push(U.format(".{0} { {1} }", key, value));
                });
                var style = $("<style>", { type: 'text/css' })
                    .html(styleSheet.join("\n"))
                    .appendTo($("head"));
            });
        })
        .fail(function () {
            alert("Failed to open TMX file.");
        });
});