// liner search
function linerSearch(list, item) {
  let index = -1;
  list.forEach((listItem,i) => {
    if (listItem === item){
      index = i;
    }
  });
  return index;
}

console.log('liner search => ', linerSearch([2, 6, 7, 90, 103], 90));

// Binary search
function binarySearch(list, item) {

}

console.log(binarySearch([2,6,7,90,103,105],90));
