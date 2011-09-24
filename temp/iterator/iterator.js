var nodeWrapper = function(elem, parent, filters){
  this.elem = elem;
  this.parent = parent;
  this.prev = nodeWrapper.nodeType.NULL_HEAD_NODE;
  this.next = nodeWrapper.nodeType.NULL_TAIL_NODE;
  this.children = [];

  var children = [];
  if (elem.nodeType == nodeWrapper.nodeType.TEXT_NODE) {
    this._nodeType = nodeWrapper.nodeType.TEXT_NODE;
    children = elem.nodeValue; //TEXT NODE
  } else if (elem.nodeType == nodeWrapper.nodeType.OCCUPY_NODE) {
    this._nodeType = nodeWrapper.nodeType.OCCUPY_NODE;
    children = this.elem.childNodes;
  } else if (elem.firstChild == null || (filters!=null && $(elem).is(filters.join(',')))) {
    this._nodeType = nodeWrapper.nodeType.LEAF_NODE; 
  } else {
    this._nodeType = nodeWrapper.nodeType.ELEM_NODE;
    children = this.elem.childNodes;
  }
  for (var i=0; i<children.length; i++) {
    var n;
    if (elem.nodeType == nodeWrapper.nodeType.TEXT_NODE) 
      n = {
        nodeType: function(){return nodeWrapper.nodeType.CHAR_NODE},
        elem: children[i], 
        parent: this, 
        prev: nodeWrapper.nodeType.NULL_HEAD_NODE, 
        next: nodeWrapper.nodeType.NULL_TAIL_NODE
      };
    else n = new nodeWrapper(children[i], this, filters);
    if (i>0) {
      this.children[i-1].next = n;
      n.prev = this.children[i-1];
    }
    this.children.push(n)
  }
}

nodeWrapper.prototype = {
  nodeType: function(filters) {
    if (!filters) return this._nodeType;

    if ($.isArray(filters)) filters = $.trim(filters.join(','));
    if (this._nodeType == nodeWrapper.nodeType.TEXT_NODE && filters == '*')
      return nodeWrapper.nodeType.LEAF_NODE;
    if (this._nodeType == nodeWrapper.nodeType.ELEM_NODE && $(this.elem).is(filters))
      return nodeWrapper.nodeType.LEAF_NODE;
    return this._nodeType;
  }
}

nodeWrapper.nodeType = {
  TEXT_NODE : 3,
  ELEM_NODE : 1,
  LEAF_NODE : 101,
  CHAR_NODE : 102,
  NULL_HEAD_NODE : 103,
  NULL_TAIL_NODE : 104,
  OCCUPY_NODE: 100 // A fake element, which should be the root node.
}

nodeWrapper.createOccupyElement = function(children){
  if (!children) children = [];
  return {
    nodeType: nodeWrapper.nodeType.OCCUPY_NODE,
    childNodes: children
  }
}

var nodeIterator = function(node, parent){
  this.node = node;
  this._started = false;
  this._end = false;
  this.parent = parent;
  this.curChild = null;
  this.childIter = null;
};

nodeIterator.ops = {
  NODE: 'node',
  LEAF_NODE : 'leaf_node',
  TEXT_NODE: 'text_node',
  TEXT: 'text',
  NODE_END: 'node_end',
  NODE_OPEN: 'node_open',
  TEXT_NODE_OPEN: 'text_node_open',
  REMOVE_LEAF_NODE: 'remove_leaf_node',
  REMOVE_NODE: 'remove_node',
  REMOVE_TEXT: 'remove_text',
  NULL: null
} 

nodeIterator.prototype = {
  isEnd: function(){
    return this._end;
  },
  isStarted: function(){
    return this._started;
  },
  _setEnd: function(){
    this._end = true;
    if (this.parent!=null) {
      this.parent.curChild = this.parent.curChild.next;
      this.parent.childIter = null;
    }
  },
  _reset: function(){
    this._started = false;
    this.curChild = null;
    this.childIter = null;
    if (this.parent!=null) {
      this.parent.curChild = this.parent.curChild.prev;
      this.parent.childIter = null;
    }
  },
  next: function(filters){
    if (this._end) {
      return [[null, nodeIterator.ops.NULL]];
    } else if (!this._started){
      this.curChild = this.node.children[0];
      this._started = true;
      switch (this.node.nodeType(filters)) {
      case nodeWrapper.nodeType.OCCUPY_NODE:
        return [[this.node.elem, nodeIterator.ops.NULL]];
      case nodeWrapper.nodeType.ELEM_NODE:
        return [[this.node.elem, nodeIterator.ops.NODE]];
      case nodeWrapper.nodeType.TEXT_NODE:
        return [[this.node.elem, nodeIterator.ops.TEXT_NODE]];
      case nodeWrapper.nodeType.LEAF_NODE:
        this._setEnd();
        return [[this.node.elem, nodeIterator.ops.LEAF_NODE]];
      }
    } else if (this.childIter == null){
      if (this.curChild == nodeWrapper.nodeType.NULL_TAIL_NODE) {
        this._setEnd();
        if (this.node.nodeType() == nodeWrapper.nodeType.OCCUPY_NODE)
          return [[this.node.elem, nodeIterator.ops.NULL]];
        else 
          return [[this.node.elem, nodeIterator.ops.NODE_END]];
      } else {
        if (this.curChild == nodeWrapper.nodeType.NULL_HEAD_NODE)
          this.curChild = this.node.children[0];
        var node = this.curChild;
        switch (node.nodeType()) {
        case nodeWrapper.nodeType.ELEM_NODE:
        case nodeWrapper.nodeType.TEXT_NODE:
          this.childIter = new nodeIterator(node, this)
          return this.childIter.next(filters);
        case nodeWrapper.nodeType.LEAF_NODE:
          this.curChild = node.next;
          return [[node.elem, nodeIterator.ops.LEAF_NODE]];
        case nodeWrapper.nodeType.CHAR_NODE:
          this.curChild = node.next;
          return [[node.elem, nodeIterator.ops.TEXT]];
        }
      }
    } else {
      return this.childIter.next(filters);
    }
  },
  prev: function(filters){
    if (!this._started) {
      return [[null, nodeIterator.ops.NULL]];
    } else if (this._end) {
      this._end = false;
      this.curChild = this.node.children[this.node.children.length-1];
      switch (this.node.nodeType(filters)) {
      case nodeWrapper.nodeType.OCCUPY_NODE:
        return [[this.node.elem, nodeIterator.ops.NULL]];
      case nodeWrapper.nodeType.ELEM_NODE:
        return [[this.node.elem, nodeIterator.ops.NODE_OPEN]];
      case nodeWrapper.nodeType.TEXT_NODE:
        return [[this.node.elem, nodeIterator.ops.TEXT_NODE_OPEN]];
      case nodeWrapper.nodeType.LEAF_NODE:
        this._reset();
        return [[this.node.elem, nodeIterator.ops.NODE_OPEN], [this.node.elem, nodeIterator.ops.REMOVE_LEAF_NODE]];
      }
    } else if (this.childIter == null) {
      if (this.curChild == nodeWrapper.nodeType.NULL_HEAD_NODE) {
        this._reset();
        if (this.node.nodeType() == nodeWrapper.nodeType.OCCUPY_NODE)
          return [[this.node.elem, nodeIterator.ops.NULL]];
        else 
          return [[this.node.elem, nodeIterator.ops.REMOVE_NODE]];
      } else {
        if (this.curChild == nodeWrapper.nodeType.NULL_TAIL_NODE)
          this.curChild = this.node.children[this.node.children.length-1];
        var node = this.curChild;
        switch (node.nodeType()) {
        case nodeWrapper.nodeType.ELEM_NODE:
        case nodeWrapper.nodeType.TEXT_NODE:
          this.childIter = new nodeIterator(node, this)
          this.childIter._end = this.childIter._started = true;
          return this.childIter.prev(filters);
        case nodeWrapper.nodeType.LEAF_NODE:
          this.curChild = node.prev;
          return [[node.elem, nodeIterator.ops.NODE_OPEN], [node.elem, nodeIterator.ops.REMOVE_LEAF_NODE]];
        case nodeWrapper.nodeType.CHAR_NODE:
          this.curChild = node.prev;
          return [[node.elem, nodeIterator.ops.REMOVE_TEXT]];
        }
      }
    } else {
      return this.childIter.prev(filters);
    }
  },
  createContainerAtCurrentPos:function(){
    if (!this._started) {
      return [];
    } else { 
      var ops = [];
      switch (this.node.nodeType()) {
      case nodeWrapper.nodeType.ELEM_NODE:
        ops.push([this.node.elem, nodeIterator.ops.NODE]);
        break;
      case nodeWrapper.nodeType.TEXT_NODE:
        ops.push([this.node.elem, nodeIterator.ops.TEXT_NODE]);
        break;
      }
      if (this.childIter != null) {
        var sub_ops = this.childIter.createContainerAtCurrentPos();
        for (var i=0; i<sub_ops.length; ++i) ops.push(sub_ops[i]);
      }
      return ops;
    }
  }
}

var Block = function(parent){
  this.parent = parent;
  this.curElem = parent;
  this._history = [];
  this._undo = [];
}

Block.prototype = {
  doCommands: function(ops){
    for (var i=0; i<ops.length; ++i) {
      var op = ops[i];
      switch (op[1]) {
      case nodeIterator.ops.NODE: 
        var ce = $(op[0]).clone().html('');
        this.curElem.append(ce);
        this.curElem = ce;
        break;
      case nodeIterator.ops.LEAF_NODE: 
        var ce = $(op[0]).clone();
        this.curElem.append(ce);
        break;
      case nodeIterator.ops.TEXT_NODE: 
        var t = document.createTextNode('');
        this.curElem.append(t);
        this.curElem = $(t);
        break;
      case nodeIterator.ops.TEXT: 
        op[2] = this.curElem[0].nodeValue.length;
        this.curElem[0].nodeValue += op[0];
        break;
      case nodeIterator.ops.NODE_END: 
        op[2] = this.curElem;
        this.curElem = this.curElem.parent();
        break;
      case nodeIterator.ops.NODE_OPEN:
      case nodeIterator.ops.TEXT_NODE_OPEN:
        var c = this.curElem[0].childNodes
        this.curElem = $(c[c.length-1])
        break;
      case nodeIterator.ops.REMOVE_LEAF_NODE:
      case nodeIterator.ops.REMOVE_NODE:
        if (this.parent[0] == this.curElem.parent()[0]) {
          this.curElem.remove();
          this.curElem = this.parent;
        } else {
          var p = this.curElem.parent();
          this.curElem.remove();
          this.curElem = $(p);
        }
        break;
      case nodeIterator.ops.REMOVE_TEXT:
        var l = this.curElem[0].nodeValue.length - op[0].length;
        this.curElem[0].nodeValue = this.curElem[0].nodeValue.substring(0, l);
        break;
      }
      this._history.push(op);
    }
  },
  count: function(){
    return this._history.length;
  }
}

$.fn.iterator = function(filters){
  if (this.length == 0) return null;
  var node;
  if (this.length > 1) node = nodeWrapper.createOccupyElement(this);
  else if (this.length == 1) node = this[0];
  return new nodeIterator(new nodeWrapper(node, null, filters));
};

$.Block = Block;
$.Block.ops = nodeIterator.ops;
