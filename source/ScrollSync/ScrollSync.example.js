/** @flow */
import React, { PureComponent } from 'react'
import { ContentBox, ContentBoxHeader, ContentBoxParagraph } from '../demo/ContentBox'
import AutoSizer from '../AutoSizer'
import Grid from '../Grid'
import ScrollSync from './ScrollSync'
import cn from 'classnames'
import styles from './ScrollSync.example.css'
import scrollbarSize from 'dom-helpers/util/scrollbarSize'
import { Resizable, ResizableBox } from 'react-resizable';
import { SortableContainer, SortableElement, arrayMove, SortableHandle } from 'react-sortable-hoc';
import _ from 'lodash';
import { CellMeasurer, CellMeasurerCache } from '../CellMeasurer'
import { fastLoremIpsum } from 'fast-lorem-ipsum'
import $ from 'jquery'

const LEFT_COLOR_FROM = hexToRgb('#471061')
const LEFT_COLOR_TO = hexToRgb('#BC3959')
const TOP_COLOR_FROM = hexToRgb('#d3d3d3')
const TOP_COLOR_TO = hexToRgb('#a9a9a9')
const MIN_WIDTH = 100
const MAX_WIDTH = 400;

const newColWidth = {};

const columnNames = _.times(50, (i) => {
  let count = Math.floor(Math.random()*30) + 1;
  return {
    name:fastLoremIpsum(`${count}w`),
    index: i 
  };
})

export default class GridExample extends PureComponent {
  constructor (props, context) {
    super(props, context)

    this.state = {
      columnWidth: 150,
      columnCount: 50,
      columnNames,
      height: 300,
      overscanColumnCount: 0,
      overscanRowCount: 5,
      rowHeight: 40,
      rowCount: 100,
      compKey: 1,
    }

    this._renderBodyCell = this._renderBodyCell.bind(this)
    this._renderHeaderCell = this._renderHeaderCell.bind(this)
    this._renderLeftSideCell = this._renderLeftSideCell.bind(this)
    
    this._renderLeftHeaderCell = this._renderLeftHeaderCell.bind(this)
    this._onResizeStop = this._onResizeStop.bind(this)
    this._onResizeStart = this._onResizeStart.bind(this)
    this._onResize = this._onResize.bind(this)
    this._getColumnWidth = this._getColumnWidth.bind(this)
    this._setColumnWidth = this._setColumnWidth.bind(this)
    this._updateGrid = this._updateGrid.bind(this)
    this._onSortEnd = this._onSortEnd.bind(this)
    this._forceUpdateGrid = this._forceUpdateGrid.bind(this)
    this._renderLeftHeaderCell2 = this._renderLeftHeaderCell2.bind(this)
    this._getRowHeight = this._getRowHeight.bind(this)
    this._setBodyGridRef = this._setBodyGridRef.bind(this)
    this._setHeaderGridRef = this._setHeaderGridRef.bind(this)

    this._cache = new CellMeasurerCache({
      defaultWidth: 150,
      fixedWidth: true,
      //defaultHeight: 40,
    })
    window._table = this;
    window._cache = this._cache
  }

  _setBodyGridRef(ref) {
    window._bodyGridRef = this._bodyGridRef = ref;
  }
  _setHeaderGridRef(ref) {
   window._headerGridRef = this._headerGridRef = ref; 
  }

  _getRowHeight() {
    let rowHeight = this._cache._rowHeightCache && this._cache._rowHeightCache["0-0"] || this.state.rowHeight
    //console.log(`rowHeight - ${rowHeight}`)
    return rowHeight
  }

  render () {
    const {
      columnCount,
      columnWidth,
      height,
      overscanColumnCount,
      overscanRowCount,
      rowHeight,
      rowCount
    } = this.state

    return (
      <ContentBox key={this.state.compKey}>
        <ContentBoxHeader
          text='ScrollSync'
          sourceLink='https://github.com/bvaughn/react-virtualized/blob/master/source/ScrollSync/ScrollSync.example.js'
          docsLink='https://github.com/bvaughn/react-virtualized/blob/master/docs/ScrollSync.md'
        />

        <ContentBoxParagraph>
          High order component that simplifies the process of synchronizing scrolling between two or more virtualized components.
        </ContentBoxParagraph>

        <ContentBoxParagraph>
          This example shows two <code>Grid</code>s and one <code>List</code> configured to mimic a spreadsheet with a fixed header and first column.
          It also shows how a scroll callback can be used to control UI properties such as background color.
        </ContentBoxParagraph>

        <ScrollSync>
          {({ clientHeight, clientWidth, onScroll, scrollVersion, scrollHeight, scrollLeft, scrollTop, scrollWidth, updateScrollVersion }) => {
            const x = scrollLeft / (scrollWidth - clientWidth)
            const y = scrollTop / (scrollHeight - clientHeight)

            const leftBackgroundColor = mixColors(LEFT_COLOR_FROM, LEFT_COLOR_TO, y)
            const leftColor = '#ffffff'
            const topBackgroundColor = mixColors(TOP_COLOR_FROM, TOP_COLOR_TO, x)
            const topColor = '#ffffff'
            const middleBackgroundColor = mixColors(leftBackgroundColor, topBackgroundColor, 0.5)
            const middleColor = '#ffffff'
            this.updateScrollVersion = updateScrollVersion;

            return (
              <div className={styles.GridRow}>
                <div
                  className={styles.LeftSideGridContainer}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    color: leftColor,
                    backgroundColor: `rgb(${topBackgroundColor.r},${topBackgroundColor.g},${topBackgroundColor.b})`
                  }}
                >
                  <Grid
                    cellRenderer={this._renderLeftHeaderCell2}
                    className={styles.HeaderGrid}
                    width={columnWidth}
                    height={this._getRowHeight()}
                    rowHeight={this._getRowHeight()}
                    columnWidth={columnWidth}
                    rowCount={1}
                    columnCount={1}
                  />
                </div>
                <div
                  className={styles.LeftSideGridContainer}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: this._getRowHeight(),
                    color: leftColor,
                    backgroundColor: `rgb(${leftBackgroundColor.r},${leftBackgroundColor.g},${leftBackgroundColor.b})`
                  }}
                >
                  <Grid
                    overscanColumnCount={overscanColumnCount}
                    overscanRowCount={overscanRowCount}
                    cellRenderer={this._renderLeftSideCell}
                    columnWidth={columnWidth}
                    columnCount={1}
                    className={styles.LeftSideGrid}
                    height={height - scrollbarSize()}
                    rowHeight={rowHeight}
                    rowCount={rowCount}
                    scrollTop={scrollTop}
                    width={columnWidth}
                  />
                </div>
                <div className={styles.GridColumn}>
                  <AutoSizer disableHeight>
                    {({ width }) => (
                      <div>
                        <div 
                          className="header-right" 
                          style={{
                            backgroundColor: `rgb(${topBackgroundColor.r},${topBackgroundColor.g},${topBackgroundColor.b})`,
                            color: topColor,
                            height: this._getRowHeight(),
                            width: width - scrollbarSize()
                          }}>
                            <SortableGrid
                              onRefChange={this._setHeaderGridRef}
                              className={cn(styles.HeaderGrid, 'noselect')}
                              columnWidth={this._getColumnWidth}

                              helperClass="sort-helper-class"
                              columnCount={columnCount}
                              height={this._getRowHeight()}
                              overscanColumnCount={overscanColumnCount}
                              cellRenderer={this._renderHeaderCell}
                              rowCount={1}
                              scrollLeft={scrollLeft}
                              width={width - scrollbarSize()}
                              axis="x" lockAxis="x" onSortEnd={this._onSortEnd} useDragHandle={true} 

                              deferredMeasurementCache={this._cache}
                              rowHeight={this._cache.rowHeight}
                            />
                        </div>
                        <div
                          style={{
                            backgroundColor: `rgb(${middleBackgroundColor.r},${middleBackgroundColor.g},${middleBackgroundColor.b})`,
                            color: middleColor,
                            height,
                            width
                          }}
                        >
                          <Grid
                            ref={this._setBodyGridRef}
                            className={styles.BodyGrid}
                            columnWidth={this._getColumnWidth}
                            columnCount={columnCount}
                            height={height}
                            onScroll={onScroll}
                            scrollLeft={scrollLeft}
                            overscanColumnCount={overscanColumnCount}
                            overscanRowCount={overscanRowCount}
                            cellRenderer={this._renderBodyCell}
                            rowHeight={rowHeight}
                            rowCount={rowCount}
                            width={width}
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
      </ContentBox>
    )
  }

  componentDidMount() {
    this._forceUpdateGrid()
  }

  _renderBodyCell ({ columnIndex, key, rowIndex, style }) {
    if (columnIndex < 1) {
      return
    }

    return this._renderLeftSideCell({ columnIndex, key, rowIndex, style })
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
          columnName={this.state.columnNames[columnIndex].name}
          columnNames={this.state.columnNames}
          parent={parent}
          cache={this._cache}
        />
      )
  }

  _renderLeftHeaderCell2 ({ columnIndex, key, rowIndex, style, parent }) {
    return <div className="div-align-center">{`C${columnIndex}`}</div>
  }
  _onResizeStop (e, data) {
    //console.log(e);
    let colIndex = parseInt(data.node.offsetParent.attributes["data-column-index"].value);

    if (colIndex >= 0) {
    //invalidate _cache for this column
    //  delete this._cache._cellHeightCache[`0-${colIndex}`]
    }

    this._updateGrid(e, data, false)
    //this._forceUpdateGrid() //TODO
  }

  _onResizeStart (e, data) {

    //console.log(data);
  }

  _updateGrid(e, data, forceUpdate = true) {
    let index = parseInt(data.node.offsetParent.attributes["data-column-index"].value);
    let newWidth = parseInt(data.size.width)
    let oldWidth = this._getColumnWidth({index})
    let width =  newWidth 
    let columnNodeStyle = undefined
    try {
      columnNodeStyle = data.node.parentNode.parentNode.style
    }catch(e){}

    //onResize update only after 10 px width change
    //if (!onResize && Math.abs(newColWidth - oldWidth) > 10) {
      this._setColumnWidth({index, width})
      forceUpdate && this._forceUpdateGrid()

      _.delay(() => {this._bodyGridRef.recomputeGridSize(index,0)}, 200)
      _.delay(() => {
        //hack fix, had to be a better way to do this, but couldn't find. Talk to Josh if we can solve this by just css (which i tried).
        if (columnNodeStyle)
          columnNodeStyle.height = "";
        //$(data.node).parent().attr("style", $(data.node).parent().attr("style").replace("height: auto;"));
      }, 100)

      window.data = {}
      window.data.node = data.node;
    //}
  }

  _forceUpdateGrid() {
    _.delay(()=> {
      this.setState({compKey: this.state.compKey + 1}) //force update
      this.forceUpdate()
    }, 200)
  }

  _onResize (e, data) {
    //console.log(data);
    //_updateGrid(e, data, true);
  }

  _renderLeftSideCell ({ columnIndex, key, rowIndex, style }) {
    const rowClass = rowIndex % 2 === 0
      ? columnIndex % 2 === 0 ? styles.evenRow : styles.oddRow
      : columnIndex % 2 !== 0 ? styles.evenRow : styles.oddRow
    const classNames = cn(rowClass, styles.cell)

    let newStyles = style;
    if (this.state.columnNames[columnIndex] && this.state.columnNames[columnIndex].width) {
      newStyles = {...style, width: this.state.columnNames[columnIndex].width}
    }

    return (
      <div
        className={classNames}
        key={key}
        style={newStyles}
      >
        {`R${rowIndex}, C${columnIndex}`}
      </div>
    )
  }

  _setColumnWidth({index, width}) {
     if(width < MIN_WIDTH || width > MAX_WIDTH) {
      return 
     }
     this.setState({
        columnNames: [
          ...this.state.columnNames.slice(0, index),
          {...this.state.columnNames[index], width},
          ...this.state.columnNames.slice(index + 1)
        ]
     })
//     newColWidth['' + index] = width;
  }

  _getColumnWidth ({index}) {
    if (this.state.columnNames[index] && this.state.columnNames[index].width){
      return this.state.columnNames[index].width
    }
    return this.state.columnWidth
  }

  _onSortEnd({oldIndex, newIndex}) {
      let scrollLeft = _.get(this._headerGridRef, '_scrollingContainer.scrollLeft')
      this.setState(state => ({
        columnNames: arrayMove(state.columnNames, oldIndex, newIndex),
      }), () => {
        this._headerGridRef.recomputeGridSize(0,0)
        _.delay(() => {
          this._bodyGridRef.recomputeGridSize(0,0)}, 200)
          //update scroll version to force sync the scroll in column grid and child grid
          if (_.isFunction(this.updateScrollVersion))
            this.updateScrollVersion(scrollLeft);
      });

      //this._forceUpdateGrid()
  }


}

function hexToRgb (hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Ported from sass implementation in C
 * https://github.com/sass/libsass/blob/0e6b4a2850092356aa3ece07c6b249f0221caced/functions.cpp#L209
 */
function mixColors (color1, color2, amount) {
  const weight1 = amount
  const weight2 = 1 - amount

  const r = Math.round(weight1 * color1.r + weight2 * color2.r)
  const g = Math.round(weight1 * color1.g + weight2 * color2.g)
  const b = Math.round(weight1 * color1.b + weight2 * color2.b)

  return { r, g, b }
}


const SortableHeader = SortableElement(({ columnName, columnNames, columnIndex, key, rowIndex, style, onResizeStart, onResizeStop, onResize, cache, parent}) => {
    let newStyles = style;
    if (columnNames[columnIndex].width) {
      newStyles = {...style, width: columnNames[columnIndex].width}
    }

    const _onResizeStop = (measure) => (e, data) => {
        onResizeStop(e, data);
        measure()
    }
    return (
      <CellMeasurer
            cache={cache}
            columnIndex={columnIndex}
            key={key}
            parent={parent}
            rowIndex={rowIndex}>
            {({measure}) => (
              <div
                  className={cn(styles.headerCell, 'ravi-header-cell')}
                  key={key}
                  style={newStyles}>
                  
                    <ResizableBox 
                      data-column-index={columnIndex}
                      axis="x"
                      draggableOpts={{defaultClassNameDragging: 'col-react-draggable-dragging'}}
                      width={newStyles.width == 'auto' ? 150 : newStyles.width} height="auto"
                      minConstraints={[100, 10]} maxConstraints={[300, 300]}
                      onResizeStart={onResizeStart}
                      onResizeStop={_onResizeStop(measure)}
                      onResize={onResize}>
                      <span>
                       <DragHandle /> {`C${columnNames[columnIndex].index} - ${columnName}`}
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