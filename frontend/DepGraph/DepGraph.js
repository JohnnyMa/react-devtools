/* @flow */

var React = require('react');
var decorate = require('../decorate');
var crawlChildren = require('./crawlChildren');
var dagre = require('dagre');

class DepGraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {renderCount: 0};
  }
  render() {
    if (this.state.renderCount > 0) {
      return (
        <DepWrapper
          renderCount={this.state.renderCount}
          onClose={() => this.setState({renderCount: 0})}
          onReload={() => this.setState({renderCount: this.state.renderCount + 1})}
        />
      );
    }
    return <button onClick={() => this.setState({renderCount: 1})}>Calculate DepGraph</button>
  }
}

class DisplayDeps {
  render() {
    return (
      <div style={styles.container}>
        <div style={styles.scrollParent}>
          <SvgGraph graph={this.props.graph} />
        </div>
        <div style={styles.buttons}>
          <button onClick={this.props.onReload}>Reload</button>
          <button onClick={this.props.onClose}>&times;</button>
        </div>
      </div>
    );
  }
}

class SvgGraph {
  render() {
    var graph = this.props.graph;
    var transform = 'translate(10, 10)'
    return (
      <svg style={styles.svg} width={graph.graph().width + 20} height={graph.graph().height + 20}>
        <g transform={transform}>
          {graph.edges().map(n => {
            var edge = graph.edge(n);
            return (
              <polyline
                points={edge.points.map(p => p.x + ',' + p.y).join(' ')}
                fill="none"
                stroke="orange"
                strokeWidth="2"
              />
            );
          })}
        </g>
        <g transform={transform}>
          {graph.nodes().map(n => {
            var node = graph.node(n);
            return (
              <rect
                height={node.height}
                width={node.width}
                x={node.x - node.width/2}
                y={node.y - node.height/2}
                fill="none"
                stroke="black"
                strokeWidth="1"
              />
            );
          })}
        </g>
        <g transform={transform}>
          {graph.nodes().map(n => {
            var node = graph.node(n);
            return (
              <text
                x={node.x}
                y={node.y+node.height/4}
                textAnchor="middle"
                fontSize="10"
                fontFamily="sans-serif"
              >{node.label + ' ' + node.count}</text>
            );
          })}
        </g>
      </svg>
    );
  }
}

var styles = {
  container: {
    border: '1px solid red',
    position: 'relative',
    minWidth: 0,
    minHeight: 0,
    flex: 1,
  },

  scrollParent: {
    overflow: 'auto',
    top: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
  },

  svg: {
    flexShrink: 0,
  },

  buttons: {
    position: 'absolute',
    bottom: 3,
    right: 3,
  },
}

function dagrize(graph) {
  var g = new dagre.graphlib.Graph();
  g.setGraph({
    nodesep: 20,
    ranksep: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));
  var used = {};
  for (var name in graph.nodes) {
    g.setNode(name, {
      label: name,
      count: graph.nodes[name],
      width: name.length * 7 + 20,
      height: 20
    });
  }

  for (var name in graph.edges) {
    var parts = name.split('\x1f');
    if (parts[0] === '$root') continue;
    g.setEdge(parts[0], parts[1], {label: graph[name]});
  }

  dagre.layout(g);
  return g;
}

var DepWrapper = decorate({
  listeners: () => [],
  shouldUpdate(nextProps, props) {
    return nextProps.renderCount !== props.renderCount;
  },
  props(store) {
    var graph = {
      edges: {},
      nodes: {},
    };
    crawlChildren('$root', [store.selected], store._nodes, 0, graph);
    return {graph: dagrize(graph)};
  }
}, DisplayDeps);

module.exports = DepGraph;
