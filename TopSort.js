/**
 * Checks if two nodes are connected in any way.
 * 
 * @param {Node} node1 
 * @param {Node} node2 
 * @returns {boolean}
 */
function isConnected(node1, node2) {
    if(node1 === node2) {
        return true;
    }

    let isConnected = false;
    const nodesToLookThrough = new Set();
    const visited = [];

    function checkEdges(node) {
        visited.push(node);
        node.getOutgoingEdges().forEach((edge) => {
            if(edge.getEndNode() === node2) {
                isConnected = true;
            } else if(!visited.includes(edge.getEndNode())) {
                nodesToLookThrough.add(edge.getEndNode());
            }
        });
        node.getIncomingEdges().forEach((edge) => {
            if(edge.getStartNode() === node2) {
                isConnected = true;
            } else if(!visited.includes(edge.getStartNode())) {
                nodesToLookThrough.add(edge.getStartNode());
            }
        });
        nodesToLookThrough.delete(node);
    }

    nodesToLookThrough.add(node1);

    while(nodesToLookThrough.size > 0) {
        nodesToLookThrough.forEach((node) => {
            checkEdges(node);
        });
    }

    return isConnected;
}

/**
 * @param {Graph} g
 * @returns {array} Multidimensional array, each item is an array with all nodes that are in this subgraph
 */
function splitGraph(g) {
    const subgraphs = [];
    g.nodes.forEach((node) => {
        let wasIntegrated = false;
        for(let i = 0; i < subgraphs.length && !wasIntegrated; ++i) {
            if(isConnected(subgraphs[i][0], node)) {
                subgraphs[i].push(node);
                wasIntegrated = true;
            }
        }
        if(!wasIntegrated) {
            subgraphs.push([node]);
        }
    });
    return subgraphs;
}

/**
 * @param {Graph} g
 * @returns {Node[]}  Multidimensional array, for each subgraph their own results
 */
function getNodesWithLeastOutgoingEdges(g) { 
    let nodes = [];
    splitGraph(g).forEach((subgraph, index) => {
        nodes.push([]);
        let outGoingEdgesCount = Number.MAX_VALUE;
        subgraph.forEach((node) => {
            const edges = node.getOutgoingEdges();
            if(edges.size < outGoingEdgesCount) {
                outGoingEdgesCount = edges.size;
                nodes[index] = [node];
            } else if (edges.size === outGoingEdgesCount) {
                nodes[index].push(node);
            }
        }); 	
    });
    return nodes;
}


/**
 * @param {Node[]} nodesWithLeastOutgoingEdges
 * @returns {Node[]} 
 */
function topSortForSubgraph(nodesWithLeastOutgoingEdges) {
    const processedNodes = [];
    const nodesToBeProcessed = [...nodesWithLeastOutgoingEdges];

    while(nodesToBeProcessed.length > 0) {
        let wasAbleToProgress = false;

        for(let i = 0; i < nodesToBeProcessed.length; ++i) {
            const curNode = nodesToBeProcessed[i];
            const dependencies = [...curNode.getOutgoingEdges()].map((edge) => edge.getEndNode());
            if(dependencies.every((node) => processedNodes.includes(node))) {
                processedNodes.push(curNode);
                nodesToBeProcessed.splice(i, 1);
                i--; // Since this entry was removed from the array decrement the counter by one
                
                const dependants = [...curNode.getIncomingEdges()].map((edge) => edge.getStartNode());
                dependants.forEach((dependant) => {
                    if(!nodesToBeProcessed.includes(dependant)) {
                        nodesToBeProcessed.push(dependant);
                    }
                });
                wasAbleToProgress = true;
            }
        }

        if(!wasAbleToProgress) {
            throw new Error('Loop detected.');
        }
    }

    return processedNodes;
}

/**
 * @param {Graph} g
 * @returns {array} Multidimensional array, for each subgraph an invidiual process order.
 */
function topSort(g) {
    const result = [];
    getNodesWithLeastOutgoingEdges(g).forEach((nodes) => {
        result.push(topSortForSubgraph(nodes));
    });
    return result;
}



// =========================== TEST DATA ========================================
const graph = new Graph();
const nodes = [
    graph.addNode(),
    graph.addNode(),
    graph.addNode(),
    graph.addNode(),
    graph.addNode(),
    graph.addNode(),
    graph.addNode(),
    graph.addNode(),
    graph.addNode(),
    graph.addNode()
];

/**
 * 1 → 2 → 3 → 4
 *    ↙      ↗
 *   8      5
 *        ↗  ↖
 *      6      7
 * 
 * 10 → 9
 * 
 * Expected top sort result:
 * 
 * Node 4, 8 and 9 have no dependencies, they are the first to be progressed.
 * Node 2 cannot be progressed yet, since the node 3 is not progressed yet.
 * Node 3, 5 and 10 can be progressed right afterwards.
 * Node 2, 6 and 7 can be pogressed.
 * Node 1 can be progressed.
 */

graph.addEdge(nodes[0].getId(), nodes[1].getId());
graph.addEdge(nodes[1].getId(), nodes[2].getId());
graph.addEdge(nodes[2].getId(), nodes[3].getId());
graph.addEdge(nodes[4].getId(), nodes[3].getId());
graph.addEdge(nodes[5].getId(), nodes[4].getId());
graph.addEdge(nodes[6].getId(), nodes[4].getId());
graph.addEdge(nodes[1].getId(), nodes[7].getId());


// Subtree 2
graph.addEdge(nodes[9].getId(), nodes[8].getId());

const topSortResult = topSort(graph);

console.log("Top Sort Result");
for(let i = 0; i < topSortResult.length; ++i) {
    console.log("======================= Subgraph: " + i + " =======================");
    topSortResult[i].forEach((node, index) => {
        console.log((index + 1) + ". node to process is the node with the id " + node.getId());
    });
}