/** @flow */
import React, { PureComponent } from 'react'
import MasterDataTable from './MasterDataTable'
import { fastLoremIpsum } from 'fast-lorem-ipsum'

const columns = [
	{
		field: '_checkBox',
		label: 'Fix ren',
		isFixedPosition: true,
		isFixedWidth: true, 
		width: 50,
	},
	{
		field: 'index',
		label: 'Index text, which is very long',
		isFixedPosition: true,
		isFixedWidth: true, 
		width: 100,
	},{
		field: 'name',
		label: 'Name',
		isFixedPosition: false,
		width: 300, //'auto', //or can be absent
		minWidth: 100,
		// undefined maxWidth means Infinity
	},{
		field: 'status',
		label: 'Status',
		width: 150,
		minWidth: 100,
		maxWidth: 300,
	},{
		field: 'lengthyText',
		label: 'Lengthy text column',
		width: 300,
		minWidth: 200,
	},{
		field: '_actions',
		label: 'Actions',
		width: 250,
		isFixedWidth: true,
	}
]
const records = _.times(100, index => {
	let count = Math.floor(Math.random()*100) + 1

	return {
		index,
		name: 'Something',
		status: 'Status',
		lengthyText: fastLoremIpsum(`${count}w`)
	}
})

const renderers = {
	_checkBox: checkBoxRenderer,
}
const headerRenderers = {
	_checkBox: checkBoxRenderer,
}

export default class GridExample extends PureComponent {
	render() {
		return (
			<MasterDataTable
				columns={columns}
				rowCount={100}
				records={records}
				hasDynamicHeightRows={true}
        		dataKey="index"
        		height={500}
        		defaultRowHeight={30}
        		defaultHeaderHeight={30}
        		renderers={renderers}
        		headerRenderers={headerRenderers}
        		onColumnUpdate={this.onColumnUpdate} />
		)
	}
	onColumnUpdate() {
		console.log('onColumnUpdate called !')
	}
}

function checkBoxRenderer(info) {
	return (
		<input type="checkbox" >
		</input>
	)
}