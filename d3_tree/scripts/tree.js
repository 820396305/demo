var jsonPath = "json/" + (location.hash.split('#')[1] || 'demo') + ".json";

d3.json(jsonPath, function(error, treeData) {
    drawTree(treeData);
});

function drawTree(treeData) {

    var vertical = false;

    // Calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 12;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;
    var maxDepth = 0;

    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();
     
    var tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal().projection(function(d) {
      if (vertical)
        return [d.x, d.y];
      else
        return [d.y, d.x];
    });

    // TODO: Pan function, can be better implemented.
    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree
    function zoom() {
      svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);

    var overCircle = function(d) {
        selectedNode = d;
        updateTempConnector();
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };

    function centerNode(source) {
        scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        //zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }


    // Toggle children on click.
    function click(d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        // update(d);
        var bio = d.name
        var img = d.image || 'images/placeholder.png'
        $("#bio").html("<img src='"+ img + "'>" + bio)
                 .addClass("has-image")
                 .fadeIn("fast");
        // centerNode(d);
        return false
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 70; // 70 pixels per line  
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
          if (d.depth > maxDepth)
            maxDepth = d.depth;
          if (vertical)
            d.y = (d.depth * (maxLabelLength * 5)); 
          else
            d.y = (d.depth * (maxLabelLength * 8)); 
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
                       .data(nodes, function(d) {
                         return d.id || (d.id = ++i);
                       });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                if (vertical)
                  return "translate(" + source.x0 + "," + source.y0 + ")";
                else
                  return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
                 .attr('class', 'nodeCircle')
                 .attr("r", 0)
                 .style("fill", function(d) {
                   return d._children ? "lightsteelblue" : "#fff";
                 });

        if (vertical) {
          nodeEnter.append("text")
            .attr("y", function(d) { 
             return d.children || d._children ? -18 : 18; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1);
        } else {
          nodeEnter.append("text")
              .attr("x", function(d) {
                return -20;
              })
              .attr("dy", ".35em")
              .attr('class', 'nodeText')
              .attr("text-anchor", function(d) {
                return "end";
              })
              .text(function(d) {
                return d.name;
              })
              .style("fill-opacity", 0);
        }

        // append an image if one exists
        nodeEnter.append("image")
                 .attr('title', '')
                 .attr("xlink:href", "")
                 .attr("x", -13)
                 .attr("y", -13)
                 .attr("width", 25)
                 .attr("height", 25);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

        node.select('image').attr("xlink:href", function(d) {
          if (d.image)
            return d.image;
          else if (d.isFemale)
            return "images/placeholder-female.png";
          else
            return "images/placeholder.png";
        });
        node.select('image').attr("title", function(d) {
          return "<strong>" + d.name + "</strong>. " + (d.bio ? d.bio : "");
        });

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function(d) {
                //return d.children || d._children ? -10 : 10;
                return -20;
            })
            .attr("text-anchor", function(d) {
                //return d.children || d._children ? "end" : "start";
                return "end";
            })
            .text(function(d) {
                return d.name;
            });

        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", 10)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                if (d.depth > 4) {
                    d.y -= 30 * (d.depth - 4)
                }
                if (vertical)
                  return "translate(" + d.x + "," + d.y + ")";
                else
                  return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text").style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                if (vertical)
                  return "translate(" + source.x + "," + source.y + ")";
                else
                  return "translate(" + source.y + "," + source.x + ")";
            }).remove();

        nodeExit.select("circle").attr("r", 0);

        nodeExit.select("text").style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link").data(links, function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        var xxx = link.enter().insert("path", "g")
            .attr("class", "link")
            .style('stroke-width', function(d) {return 3*(maxDepth - d.source.depth) + 'px';})
            .style('opacity', function(d) {return d.source.depth >= 4 ? 0 : 0.5})
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });
        // Transition links to their new position.
        link.transition().duration(duration).attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    // root = treeData
    treeData.children.forEach(function(item){
        item.children.reverse()
        item.children.forEach(function(item){
            item.children.reverse()
            item.children.forEach(function(item){
                item.children[0].children = [item.children[1]]
                item.children[0].children[0].children = [item.children[2]]
                item.children.splice(1,2)
                item.children.reverse()
            })
        })
    })
    // console.log(treeData)
    root = treeData
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);
    d3.select('svg').on('click', function(e){
        console.log(1)
        return false
    })
};
