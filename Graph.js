/**
* Graph structure for trac mob
*
* @author Sebastian Szablewski
* @since 02.03.2018
* @version 1.1.0
*/

/*
* ===================================
*        Changelog
* ===================================
*
 * 1.1.0: - added graph import and export
*      in a custom json string format.
*    - moved 'addElement' call on payload from
*      graph to element constructors.
*    - changed most arrays to sets.
*    - fixed issue with 'addEdge' method creating
*      a wrong payload object.
*
* 1.0.0: initial release
*/

/*
* ===================================
*  Functions to use (pseudo API)
* ===================================
*
* Graph:
*    getEdgeById(int): Edge
*    getNodeById(int): Node
*    getPayloadById(int): Payload
*    getElementsByPayloadProperty(string, mixed): GraphElement[]
*    addNode(Object|null): Node
*    addEdge(int, int, Object|null): Edge|[Edge, Edge]
*    removeNode(int): void
*    removeEdge(int): void
*    export(): string
*    import(string): void
*              
 * GraphElement:
*    getId(): int
*
* Node:
*    getId(): int
*    getPayload(): Payload|null
*    getOutgoingEdges(): Edge[]
*    addOutgoingEdge(Edge): void
*    removeOutgoingEdge(Edge): void
*    getIncomingEdges(): Edge[]
*    addIncomingEdge(Edge): void
*    removeIncomingEdge(Edge): void
*    canReach(int): boolean
*    canBeReachedBy(int): boolean
*
* Edge:
*    getId(): int
*    getStartNode(): Node
*    getEndNode(): Node
*    getPayload(): Payload|null
*
* Payload:
*    getId(): int
*    getElements(): GraphElement[]
*    addElement(Node|Edge): void
*    removeElement(Node|Edge): void
*    getProperty(string): mixed    
 *    setProperty(string, mixed): void       
 */
/**
* MultiEdgesNotAllowedError
* Custom error for trying to add a multi edge.
*/
class MultiEdgesNotAllowedError extends Error {
  constructor() {
    super('Multi edges are not allowed in this graph!');
  }
}

/**
* LoopsNotAllowedError
* Custom error for trying to add a loop edge.
*/
class LoopsNotAllowedError extends Error {
  constructor() {
    super('Loops are not allowed in this graph!');
  }
}

/**
* NodeNotFoundError
* Custom error for trying to access a node that does not exist
*/
class NodeNotFoundError extends Error {
  constructor(id) {
    super(`Node with id '${id}' not found`);
  }
}

// Counter for Nodes, incremented when adding a new Node
let currentNodeId = 0;

// Counter for Edges, incremented when adding a new Edge
let currentEdgeId = 0;

// Counter for Payloads, incremented when adding a new Payload
let currentPayloadId = 0;

/**
* Type of Graph
*/
const GraphType = {
  UNDIRECTED: 'graph.undirected',
  DIRECTED: 'graph.directed'
};

/**
* Type of data weighting.
* NONE: no weighting defined. Algorithms that require a weighting
*     should abort upon start.
* NODE: the weighting information is in the payload of the Nodes.
* EDGE: the weighting information is in the payload of the Edges.
* BOTH: the weighting information is in the payload o the Nodes and Edges.
*/
const WeightingType = {
  NONE: 'weighting.none',
  NODE: 'weighting.node',
  EDGE: 'weighting.edge',
  BOTH: 'weighting.both'
};

/**
* GraphElement
*/
class GraphElement {

  /**
   * GraphElement constructor
   * @param {int} id
   */
  constructor(id) {
    this.id = id;
  }

  /**
   * Return the ID of the element
   * @return {int}
   */
  getId() {
    return this.id;
  }
}

/**
* Node
*/
class Node extends GraphElement {

  /**
   * Node constructor
   * @param {Payload} payload
   */
  constructor(payload = null) {
    super(++currentNodeId);
    this.payload = payload;
    this.outgoingEdges = new Set();
    this.incomingEdges = new Set();
    if (this.payload) {
      this.payload.addElement(this);
    }
  }

  /**
   * Return the Payload object of the node
   * @return {Payload|null}
   */
  getPayload() {
    return this.payload;
  }

  /**
   * Return an array of Edges that go away from this node
   * @return {Set<Edge>}
   */
  getOutgoingEdges() {
    return this.outgoingEdges;
  }

  /**
   * Add an object to the list of outgoing edges
   * if it does not include it already.
   * @param {Edge} edgeToAdd
   */
  addOutgoingEdge(edgeToAdd) {
    this.outgoingEdges.add(edgeToAdd);
  }

  /**
   * Removes an object from the list of outgoing edges if it is included.
   * @param {Edge} edgeToRemove
   */
  removeOutgoingEdge(edgeToRemove) {
    this.outgoingEdges.delete(edgeToRemove);
  }

  /**
   * Return an array of Edges that go into this node
   * @return {Edge[]}
   */
  getIncomingEdges() {
    return this.incomingEdges;
  }

  /**
   * Add an object to the list of incoming edges
   * if it does not include it already.
   * @param {Edge} edgeToAdd
   */
  addIncomingEdge(edgeToAdd) {
    this.incomingEdges.add(edgeToAdd);
  }

  /**
   * Removes an object from the list of incoming edges if it is included.
   * @param {Edge} edgeToRemove
   */
  removeIncomingEdge(edgeToRemove) {
    this.incomingEdges.delete(edgeToRemove);
  }

  /**
   * Checks if one of its outgoing edges reaches a node with the given id
   * @param {int} nodeId
   * @return {Boolean}
   */
  canReach(nodeId) {
    return Array.from(this.outgoingEdges).some(
      (edge) => edge.getEndNode().getId() === nodeId
    );
  }

  /**
   * Checks if one of its incoming edges comes from a node with the given id
   * @param {int} nodeId
   * @return {Boolean}
   */
  canBeReachedBy(nodeId) {
    return Array.from(this.incomingEdges).some(
      (edge) => edge.getStartNode().getId() === nodeId
    );
  }

  /**
   * Export the node to its minimum needed data
   */
  export() {
    const result = { i: this.id };
    if (this.payload) {
      result.p = this.payload.getId();
    }
    return result;
  }
}

/**
* Edge
*/
class Edge extends GraphElement {

  /**
   * Edge constructor
   * @param {Node} startNode
   * @param {Node} endNode
   * @param {Payload|null} payload
   */
  constructor(startNode, endNode, payload = null) {
    super(++currentEdgeId);
    this.startNode = startNode;
    this.endNode = endNode;
    this.payload = payload;
    if (this.payload) {
      this.payload.addElement(this);
    }
  }

  /**
   * Return the start node of this edge
   * @return {Node}
   */
  getStartNode() {
    return this.startNode;
  }

  /**
   * Return the end node of this edge
   * @return {Node}
   */
  getEndNode() {
    return this.endNode;
  }

  /**
   * Return the Payload object of the edge
   * @return {Payload|null}
   */
  getPayload() {
    return this.payload;
  }

  /**
   * Export the edge to its minimum needed data
   */
  export() {
    const result = { i: this.id, s: this.startNode.getId(), e: this.endNode.getId() };
    if (this.payload) {
      result.p = this.payload.getId();
    }
    return result;
  }
}

/**
* Payload
*/
class Payload extends GraphElement {

  /**
   * Payload constructor
   * @param {Object} payloadObject
   */
  constructor(payloadObject = {}) {
    super(++currentPayloadId);
    this.elements = new Set();
    this.data = payloadObject;
  }

  /**
   * Return an array of elements that use this payload
   * @return {Set<GraphElement>}
   */
  getElements() {
    return this.elements;
  }

  /**
   * Add an object to the list elements using this payload
   * @param {Node|Edge} elementToAdd
   */
  addElement(elementToAdd) {
    this.elements.add(elementToAdd);
  }

  /**
   * Removes an object from the list of elements using this payload
   * @param {Node|Edge} edgeToRemove
   */
  removeElement(elementToRemove) {
    this.elements.delete(elementToRemove);
  }

  /**
   * Return the value of a property stored in this payload
   * @param {String} propName
   * @return {mixed}
   */
  getProperty(propName) {
    return this.data[propName];
  }

  /**
   * Set the value of a property stored in this payload
   * @param {String} propName
   * @param {mixed} propValue
   */
  setProperty(propName, propValue) {
    this.data[propName] = propValue;
  }

  /**
   * Export the payload to its minimum needed data
   */
  export() {
    return { i: this.id, d: { ...this.data } };
  }
}

/**
* Graph
*/
class Graph {

  /**
   * Graph constructor
   * @param {GraphType|String} graphType
   * @param {Boolean} allowLoops
   * @param {Boolean} allowMultiEdges
   * @param {WeightingType|String} weightingType
   */
  constructor(graphType, allowLoops, allowMultiEdges, weightingType) {
    this.edges = new Map();
    this.nodes = new Map();
    this.payloads = new Map();

    this.graphType = graphType;
    this.allowLoops = allowLoops;
    this.allowMultiEdges = allowMultiEdges;
    this.weightingType = weightingType;
  }

  /**
   * Return an edge from the map of edges by its id
   * @param {int} id
   * @return {Edge}
   */
  getEdgeById(id) {
    return this.edges.get(id);
  }

  /**
   * Return an node from the map of nodes by its id
   * @param {int} id
   * @return {Node}
   */
  getNodeById(id) {
    return this.nodes.get(id);
  }

  /**
   * Return a payload from the map of payloads by its id
   * @param {int} id
   * @return {Payload}
   */
  getPayloadById(id) {
    return this.payloads.get(id);
  }

  /**
   * Return an array of nodes and edges, where their payload contains
   * a property with a given value.
   * @param {String} propName
   * @param {mixed} propValue
   * @return {GraphElement[]}
   */
  getElementsByPayloadProperty(propName, propValue) {
    const results = [];

    // Get all payload objects where the wanted property has the wanted value
    const filteredPayloads = Array.from(this.payloads.values()).filter(
      (payload) => payload.getProperty(propName) === propValue
    );

    // No payloads found => no elements fit.
    if (filteredPayloads.length > 0) {
      // For all payloads, get all connected elements
      filteredPayloads.forEach((payload) => {
        results.push(...payload.getElements());
      });
    }
    return results;
  }

  /**
   * Add a new node to the graph with an optional payload.
   * @param {Object|null} payloadData
   * @return {Node}
   */
  addNode(payloadData = null) {
    let nodePayload = null;
    if (payloadData) {
      nodePayload = new Payload(payloadData);
      this.payloads.set(nodePayload.getId(), nodePayload);
    }
    const node = new Node(nodePayload);
    this.nodes.set(node.getId(), node);
    return node;
  }

  /**
   * Add a new edge to the graph with an optional payload.
   * @param {int} startNodeId
   * @param {int} endNodeId
   * @param {Object|null} payloadData
   * @return {Edge|[Edge, Edge]}
   */
  addEdge(startNodeId, endNodeId, payloadData = null) {
    // Check for allowed loops
    if (!this.allowLoops && startNodeId === endNodeId) {
      throw new LoopsNotAllowedError();
    }

    // Get startNode and endNode or throw an error if they don't exist
    const startNode = this.nodes.get(startNodeId);
    if (!startNode) {
      throw new NodeNotFoundError(startNodeId);
    }
    const endNode = this.nodes.get(endNodeId);
    if (!endNode) {
      throw new NodeNotFoundError(endNodeId);
    }

    // Check for allowed multi edges
    if (!this.allowMultiEdges && startNode.canReach(endNodeId)) {
      throw new MultiEdgesNotAllowedError();
    }

    // Create payload
    let edgePayload = null;
    if (payloadData) {
      edgePayload = new Payload(payloadData);
      this.payloads.set(edgePayload.getId(), edgePayload);
    }

    // Create edge and add to graph
    const edge = this._createNewEdge(startNode, endNode, edgePayload);

    // To make most algorithms work on an undirected graph,
    // create a copy of the edge with the opposite direction
    if (this.graphType === GraphType.UNDIRECTED) {
      const returnEdge = this._createNewEdge(endNode, startNode, edgePayload);
      return [edge, returnEdge];
    }

    return edge;
  }

  /**
   * Creates a new edge, sets its connections and adds it to the graph.
   * @private Only to be used by graph internally
   * @param {Node} startNode
   * @param {Node} endNode
   * @param {Payload|null} payload
   * @return {Edge}
   */
  _createNewEdge(startNode, endNode, payload = null) {
    const edge = new Edge(startNode, endNode, payload);
    startNode.addOutgoingEdge(edge);
    endNode.addIncomingEdge(edge);
    this.edges.set(edge.getId(), edge);
    return edge;
  }

  /**
   * Remove a node from the graph, removing all of its connected edges
   * as well as now unneeded payloads.
   * @param {int} nodeId
   */
  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (node) {
      if (node.getPayload()) {
        // Remove node from payload and the payload itself,
        // if no elements are connected to it.
        node.getPayload().removeElement(node);
        if (node.getPayload().elements.length === 0) {
          this.payloads.delete(node.getPayload());
        }
      }
      // Remove the node and all of its connected edges
      this.nodes.delete(node.getId());
      [...node.outgoingEdges, ...node.incomingEdges].forEach((edge) => {
        this.removeEdge(edge.getId());
      });
    }
  }

  /**
   * Remove an edge from the graph and its now unneeded payloads.
   * @param {int} edgeId
   */
  removeEdge(edgeId) {
    const edge = this.edges.get(edgeId);
    if (edge) {
      if (edge.getPayload()) {
        // Remove edge from payload and the payload itself,
        // if no elements are connected to it.
        edge.getPayload().removeElement(edge);
        if (edge.getPayload().elements.length === 0) {
          this.payloads.delete(edge.getPayload());
        }
      }
      // Remove the edge and its connection from its nodes
      this.edges.delete(edge.getId());
      edge.startNode.removeOutgoingEdge(edge);
      edge.endNode.removeIncomingEdge(edge);
    }
  }

  /**
   * Export the graph into a JSON string
   *
   * @return {String}
   */
  export() {
    const exportedPayloads = [];
    const exportedNodes = [];
    const exportedEdges = [];
    this.payloads.forEach((payload) => {
      exportedPayloads.push(payload.export());
    });
    this.nodes.forEach((node) => {
      exportedNodes.push(node.export());
    });
    this.edges.forEach((edge) => {
      exportedEdges.push(edge.export());
    });
    return JSON.stringify({
      p: exportedPayloads,
      n: exportedNodes,
      e: exportedEdges
    });
  }

  /**
   * Import a graph from a JSON string
   *
   * @param {String} json
   */
  import(json) {
    this.nodes.clear();
    this.edges.clear();
    this.payloads.clear();
    const result = JSON.parse(json);
    if (result.p) {
      result.p.forEach((payloadData) => {
        const payload = new Payload(payloadData.d);
        payload.id = payloadData.i;
        this.payloads.set(payload.getId(), payload);
        currentPayloadId--; // revert counter increase from constructor
      });
    }
    if (result.n) {
      result.n.forEach((nodeData) => {
        const payload = nodeData.p ? this.getPayloadById(nodeData.p) : null;
        const node = new Node(payload);
        node.id = nodeData.i;
        this.nodes.set(node.getId(), node);
        currentNodeId--; // revert counter increase from constructor
      });
    }
    if (result.e) {
      result.e.forEach((edgeData) => {
        const startNode = this.nodes.get(edgeData.s);
        const endNode = this.nodes.get(edgeData.e);
        const payload = edgeData.p ? this.getPayloadById(edgeData.p) : null;
        const edge = new Edge(startNode, endNode, payload);
        edge.id = edgeData.i;
        startNode.addOutgoingEdge(edge);
        endNode.addIncomingEdge(edge);
        this.edges.set(edge.getId(), edge);
        currentEdgeId--; // revert counter increase from constructor
      });
    }
  }
}