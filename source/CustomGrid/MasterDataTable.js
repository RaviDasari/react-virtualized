/** @flow */
import React, { PureComponent } from 'react'
import { ContentBox, ContentBoxHeader, ContentBoxParagraph } from '../demo/ContentBox'
import AutoSizer from '../AutoSizer'
import Grid from '../Grid'
import ScrollSync from '../ScrollSync'
import cn from 'classnames'
import styles from './MasterDataTable.example.css'
import scrollbarSize from 'dom-helpers/util/scrollbarSize'
import { Resizable, ResizableBox } from 'react-resizable';
import { SortableContainer, SortableElement, arrayMove, SortableHandle } from 'react-sortable-hoc';
import _ from 'lodash';
import { CellMeasurer, CellMeasurerCache } from '../CellMeasurer'
import { fastLoremIpsum } from 'fast-lorem-ipsum'
import PropTypes from 'prop-types'

const INFINITY = 7000 //for timebeing
const MIN_COL_WIDTH = 50
const MAX_COL_WIDTH = INFINITY 


/**
	An example configuration below.
	This grid will follow the order of the columns blindly, so you need to 
	make sure all the fixed columns will come first and then the rest of the columns.
	columns = [
		{
			field: '_checkBox',
			label: 'Fix ren'
			isFixedPosition: true,
			isFixedWidth: true, 
			width: 50,
		},{
			field: 'name',
			label: 'Name',
			isFixedPosition: true,
			width: 'auto', //or can be absent
			minWidth: 100,
			MaxWidth: 300,
		},{
			field: 'status',
			label: 'Status',
			width: 100,
			minWidth: 100,
			maxWidth: 300,
		},{
			field: '_actions',
			label: '',
			width: 150,
			isFixedWidth: true,
		}
	]

	renderers or headerRenderers  = {
		_checkBox: (info) => { ... },
		name: (info) => { ... },
		status: (info) => { ... },
		_actions: (info) => { ... },
	}
**/

export default class MasterDataTable extends PureComponent {
    static propTypes = {
        records: PropTypes.array,
        columns: PropTypes.array,
        hasDynamicHeightRows: PropTypes.bool.isRequired,
        dataKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
        renderers: PropTypes.objectOf(PropTypes.func),
        headerRenderers: PropTypes.objectOf(PropTypes.func),
        height: PropTypes.number,
        defaultRowHeight: PropTypes.number,
        defaultHeaderHeight: PropTypes.number,
        rowCount: PropTypes.number,

        //callbacks
        onColumnUpdate: PropTypes.func,

        //...more
    };

    constructor(props, context) {
        super(props, context)

        this.state = this.buildStateFromProps(props)

        this._renderBodyCell = this._renderBodyCell.bind(this)
        this._renderHeaderCell = this._renderHeaderCell.bind(this)
        this._renderFixedBodyCell = this._renderFixedBodyCell.bind(this)

        this._renderLeftHeaderCell = this._renderLeftHeaderCell.bind(this)
        this._onResizeStop = this._onResizeStop.bind(this)
        this._onResizeStart = this._onResizeStart.bind(this)
        this._onResize = this._onResize.bind(this)
        this._getColumnWidth = this._getColumnWidth.bind(this)
        this._setColumnWidth = this._setColumnWidth.bind(this)
        this._onSortEnd = this._onSortEnd.bind(this)
        this._forceUpdateGrid = this._forceUpdateGrid.bind(this)
        this._renderFixedHeaderCell = this._renderFixedHeaderCell.bind(this)
        this._getColumnGridRowHeight = this._getColumnGridRowHeight.bind(this)
        this._setBodyGridRef = this._setBodyGridRef.bind(this)
        this._setRightBodyGridRef = this._setRightBodyGridRef.bind(this)
        this._setHeaderGridRef = this._setHeaderGridRef.bind(this)
        this._renderTableCell = this._renderTableCell .bind(this)

        this._forceRenderBody = this._forceRenderBody.bind(this)

        this._headerCache = new CellMeasurerCache({
            defaultWidth: 50, //TODO, do we need this?
            fixedWidth: true,
        })

        this._bodyCache = new CellMeasurerCache({
            defaultWidth: 50, //TODO, do we need this?
            fixedWidth: true,
        })

        //only for debugging
        window._table = this;
        window._headerCache = this._headerCache
        window._bodyCache = this._bodyCache
    }

    buildStateFromProps(newProps) {
    	const fixedColumnCount = _.chain(newProps.columns).filter('isFixedPosition').size().value() || 0
    	const columnCount = _.size(newProps.columns)
    	const columns = newProps.columns

    	//returns state delta
    	return {
			fixedColumnCount,
			columnCount,
			columns
    	}
    }

    render() {
        const {
            height,
            overscanColumnCount,
            overscanRowCount,
            defaultRowHeight,
            defaultHeaderHeight,
            rowCount
        } = this.props

        const fixedGridProps = {
        	width: 50, //TODO: update width prop based on the number of fixed columns
        }

        const { columnCount, columns } = this.state


    return (
      <div className="master-data-table" key={this.state.compKey || 0}>
        <ScrollSync>
          {({ clientHeight, clientWidth, onScroll, scrollVersion, scrollHeight, scrollLeft, scrollTop, scrollWidth, updateScrollVersion }) => {
            const x = scrollLeft / (scrollWidth - clientWidth)
            const y = scrollTop / (scrollHeight - clientHeight)

            this.updateScrollVersion = updateScrollVersion;

            return (
              <div className={styles.GridRow}>
                <div className={styles.LeftSideGridContainer} style={{top: 0}} >
                  <Grid
                    cellRenderer={this._renderFixedHeaderCell}
                    className={styles.HeaderGrid}
                    width={fixedGridProps.width}
                    height={this._getColumnGridRowHeight()}
                    rowHeight={this._getColumnGridRowHeight()}
                    columnWidth={fixedGridProps.width}
                    rowCount={1}
                    columnCount={1} />
                </div>
                <div className={styles.LeftSideGridContainer} style={{top: this._getColumnGridRowHeight()}}>
                  <Grid
                    ref={this._setRightBodyGridRef}
                    overscanColumnCount={overscanColumnCount}
                    overscanRowCount={overscanRowCount}
                    cellRenderer={this._renderFixedBodyCell}
                    columnWidth={fixedGridProps.width}
                    columnCount={1}
                    className={styles.LeftSideGrid}
                    height={height - scrollbarSize()}
                    rowCount={rowCount}
                    scrollTop={scrollTop}
                    width={fixedGridProps.width}
                    
                    deferredMeasurementCache={this._bodyCache}
		                rowHeight={this._bodyCache.rowHeight} />
                </div>
                <div className={styles.GridColumn}>
                  <AutoSizer disableHeight>
                    {({ width }) => (
                      <div>
                        <div 
                          className="header-right" 
                          style={{height: this._getColumnGridRowHeight(), width: width - scrollbarSize()}}>
		                    <SortableGrid
		                      axis="x" 
		                      lockAxis="x" 
		                      useDragHandle={true} 
		                      helperClass="sort-helper-class"
		                      onRefChange={this._setHeaderGridRef}
		                      onSortEnd={this._onSortEnd} 

		                      className={cn(styles.HeaderGrid, 'noselect')}
		                      columnWidth={this._getColumnWidth}
		                      columnCount={columnCount}
		                      height={this._getColumnGridRowHeight()}
		                      overscanColumnCount={overscanColumnCount}
		                      cellRenderer={this._renderHeaderCell}
		                      rowCount={1}
		                      scrollLeft={scrollLeft}
		                      width={width - scrollbarSize()}

		                      deferredMeasurementCache={this._headerCache}
		                      rowHeight={this._headerCache.rowHeight} />
                        </div>
                        <div style={{ height, width }}>
                          <Grid
                            ref={this._setBodyGridRef}
                            className={styles.BodyGrid}
                            columnWidth={this._getColumnWidth}
                            columnCount={columnCount}
                            height={height}
                            onScroll={onScroll}
                            overscanColumnCount={overscanColumnCount}
                            overscanRowCount={overscanRowCount}
                            cellRenderer={this._renderBodyCell}
                            rowCount={rowCount}
                            width={width}

                            deferredMeasurementCache={this._bodyCache}
		                    rowHeight={this._bodyCache.rowHeight}
                          />
                        </div>
                      </div>
                    )}
                  </AutoSizer>
                </div>
              </div>
            )
          }}
        </ScrollSync>
      </div>
    )
  }

  _setBodyGridRef(ref) {
    window._bodyGridRef = this._bodyGridRef = ref;
  }
  _setRightBodyGridRef(ref) {
    window._rightBodyGridRef = this._rightBodyGridRef = ref;
  }
  _setHeaderGridRef(ref) {
	 window._headerGridRef = this._headerGridRef = ref;
  }

  _getColumnGridRowHeight() {
	return this._headerCache._rowHeightCache && this._headerCache._rowHeightCache["0-0"] || this.props.defaultRowHeight
  }

  _forceRenderBody() {
    this._bodyCache.clearAll() // to avoid flicker affect, use below line
    //this._bodyCache._cellHeightCache = {}
    this._bodyGridRef.recomputeGridSize(0,0)
    _.delay(()=> {
      //this._bodyGridRef.recomputeGridSize(0,0)
      _.delay(() => {
        this._rightBodyGridRef.recomputeGridSize(0,0)
        this._rightBodyGridRef.recomputeGridSize(0,0)
      })
    })
  }

  componentDidMount() {
    this._forceUpdateGrid()
  }

  _renderBodyCell ({ columnIndex, key, rowIndex, style }) {
    if (columnIndex < 1) {
      return
    }

    return this._renderTableCell({ columnIndex, key, rowIndex, style })
  }

  _renderHeaderCell ({ columnIndex, key, rowIndex, style, parent }) {
    if (columnIndex < 1) {
      return
    }

    return this._renderLeftHeaderCell({ columnIndex, key, rowIndex, style, parent })
  }

  _renderLeftHeaderCell ({ columnIndex, key, rowIndex, style, parent }) {
    return (
        <SortableHeader
          columnIndex={columnIndex}
          key={key}
          index={columnIndex}
          rowIndex={rowIndex}
          style={style}
          onResizeStop={this._onResizeStop}
          onResizeStart={this._onResizeStart}
          onResize={this._onResize}
          columns={this.state.columns}
          parent={parent}
          cache={this._headerCache}
        />
      )
  }

  _renderFixedHeaderCell ({ columnIndex, key, rowIndex, style, parent }) {
  	const field = _.get(this.state, `columns[${columnIndex}].field`)
    const label = _.get(this.state, `columns${columnIndex}.label`)
    const displayContent = _.has(this.props.headerRenderers, field) ? 
    	this.props.headerRenderers[field]({field, label}) : label;
    return (
    	<div className="div-align-center">{displayContent}</div>
    )
  }
  _onResizeStop (e, data) {
    const index = parseInt(data.node.offsetParent.attributes["data-column-index"].value);
    const newWidth = parseInt(data.size.width)

    window.data = {}
    window.data.node = data.node;

    let columnNode = undefined
    try {
      columnNode = data.node.parentNode.parentNode

      //TODO: hide element to avoid showing flicker effect
      columnNode.className += ' cell-being-measured'
    }
    catch(e) {}
    
  	this._setColumnWidth({index, width: newWidth})
  	this._headerGridRef.recomputeGridSize(0,0)
  	//update grid - force rerender
  	_.delay(() => {this._bodyGridRef.recomputeGridSize(index,0)}, 200)
  	_.delay(() => {
  	    // Hack fix, tried for a better way to do this, but couldn't. 
  	    // Talk to Josh if we can solve this by just css (which I tried but not sure if I missed something).
  	    if (columnNode) {
  	      columnNode.style.height = "";
          columnNode.className = columnNode.className ? columnNode.className.replace('cell-being-measured', '') : columnNode.className
        }
  	    //$(data.node).parent().attr("style", $(data.node).parent().attr("style").replace("height: auto;"));
  	}, 100)

    this._forceRenderBody()
  }

  _onResizeStart (e, data) {

    //console.log(data);
  }

  _forceUpdateGrid() {
    _.delay(()=> {
      this.setState({compKey: (this.state.compKey || 0) + 1}) //force update
      this.forceUpdate()
    }, 200)
  }

  _onResize (e, data) {
    //console.log(data);
  }

  _renderFixedBodyCell ({ columnIndex, key, rowIndex, style }) {
  	return this._renderTableCell({ columnIndex, key, rowIndex, style })
  }

  _renderTableCell ({ columnIndex, key, rowIndex, style, parent }) {
    const rowClass = rowIndex % 2 === 0
      ? columnIndex % 2 === 0 ? styles.evenRow : styles.oddRow
      : columnIndex % 2 !== 0 ? styles.evenRow : styles.oddRow
    const classNames = cn(rowClass, styles.cell, _.get(style, 'height') === 'auto' ? 'cell-being-measured' : '')

    let newStyles = style;
    if (this.state.columns[columnIndex] && this.state.columns[columnIndex].width) {
      newStyles = {...style, width: this.state.columns[columnIndex].width}
    }

    //data
    const field = _.get(this.state, `columns[${columnIndex}].field`)
    const data = _.get(this.props, `records[${rowIndex}].${field}`)

    const displayContent = _.has(this.props.renderers, field) ? 
    	this.props.renderers[field]({field, data, record: this.props.records[rowIndex]}) : data;

    return (
    	<CellMeasurer
            cache={this._bodyCache}
            columnIndex={columnIndex}
            key={key}
            parent={parent}
            rowIndex={rowIndex}>
            {({measure}) => (
		      <div
		        className={classNames}
		        key={key}
		        style={newStyles} >
		        {displayContent}
		      </div>
		    )}
		</CellMeasurer>
    )
  }

  _setColumnWidth({index, width}) {
     if(width < MIN_COL_WIDTH || width > MAX_COL_WIDTH) {
      return 
     }

     this.setState({
        columns: [
          ...this.state.columns.slice(0, index),
          {...this.state.columns[index], width},
          ...this.state.columns.slice(index + 1)
        ]
     })
  }

  _getColumnWidth ({index}) {
  	return _.get(this.state, `columns[${index}].width`) || 50 //TODO do I need this?
  }

  _onSortEnd({oldIndex, newIndex}) {
      this.setState(state => ({
        columns: arrayMove(state.columns, oldIndex, newIndex),
      }), () => {
        this._headerGridRef.recomputeGridSize(0,0)
        _.delay(() => {
          this._bodyGridRef.recomputeGridSize(0,0)}, 200)
          //update scroll version to force sync the scroll in column grid and child grid
          if (_.isFunction(this.updateScrollVersion))
            this.updateScrollVersion();
      });
  }


}


const SortableHeader = SortableElement(({ columns, columnIndex, key, rowIndex, style, onResizeStart, onResizeStop, onResize, cache, parent}) => {
    let newStyles = style;
    const columnInfo = columns[columnIndex]
    if (columnInfo.width) {
      newStyles = {...style, width: columnInfo.width}
    }

    const _onResizeStop = (measure) => (e, data) => {
        onResizeStop(e, data);
        measure()
    }
    //tip: minConstraints or in {[width, height]} format
    const minConstraints = [columnInfo.minWidth || MIN_COL_WIDTH, 10]
    const maxConstraints = [columnInfo.maxWidth || INFINITY, INFINITY]
    return (
      <CellMeasurer
            cache={cache}
            columnIndex={columnIndex}
            key={key}
            parent={parent}
            rowIndex={rowIndex}>
            {({measure}) => (
              <div
                  className={cn(styles.headerCell, 'ravi-header-cell', _.get(newStyles, 'height') === 'auto' ? 'cell-being-measured' : '')}
                  key={key}
                  style={newStyles}>
                  
                    <ResizableBox 
                      data-column-index={columnIndex}
                      axis="x"
                      draggableOpts={{defaultClassNameDragging: 'col-react-draggable-dragging'}}
                      width={newStyles.width == 'auto' ? 50 : newStyles.width}
                      height="auto"
                      minConstraints={minConstraints}
                      maxConstraints={maxConstraints}
                      onResizeStart={onResizeStart}
                      onResizeStop={_onResizeStop(measure)}
                      onResize={onResize}>
                      <span>
                       <DragHandle /> {columns[columnIndex].label}
                      </span>
                    </ResizableBox>
              </div>
          )
      }
      </CellMeasurer>
    )
  })

//const SortableGrid = SortableContainer(Grid)

const SortableGrid = SortableContainer((props) => {
  return (
    <Grid
      ref={props.onRefChange}
      {...props} />
  )
})


const DragHandle = SortableHandle(() => <span className="col-drag-handle">::</span>)

MasterDataTable.defaultProps = {
    overscanColumnCount: 5,
    overscanRowCount: 10,
    defaultRowHeight: 30,
    defaultHeaderHeight: 30,
};