module.exports = {
	arraysEqual: (arr1, arr2) => {
		arr1.sort();
		arr2.sort();

		return arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i]);
	},
};
