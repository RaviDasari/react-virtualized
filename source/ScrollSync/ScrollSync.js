import PropTypes from 'prop-types'
import { PureComponent } from 'react'

/**
 * HOC that simplifies the process of synchronizing scrolling between two or more virtualized components.
 */
export default class ScrollSync extends PureComponent {
  static propTypes = {
    /**
     * Function responsible for rendering 2 or more virtualized components.
     * This function should implement the following signature:
     * ({ onScroll, scrollLeft, scrollTop }) => PropTypes.element
     */
    children: PropTypes.func.isRequired
  };

  constructor (props, context) {
    super(props, context)

    this.state = {
      clientHeight: 0,
      clientWidth: 0,
      scrollHeight: 0,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: 0,
      scrollVersion: 0,
    }

    this._onScroll = this._onScroll.bind(this)
    this._updateScrollVersion = this._updateScrollVersion.bind(this)
  }

  render () {
    const { children } = this.props
    const { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth, scrollVersion } = this.state
    //console.log(`scrollLeft: ${scrollLeft}`)
    return children({
      clientHeight,
      clientWidth,
      onScroll: this._onScroll,
      updateScrollVersion: this._updateScrollVersion,
      scrollHeight,
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollVersion,
    })
  }

  _updateScrollVersion(scrollLeft){
    this.setState({scrollVersion: this.state.scrollVersion + 1, scrollLeft})
  }

  _onScroll ({ clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth }) {
    this.setState({ clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth })
  }
}
