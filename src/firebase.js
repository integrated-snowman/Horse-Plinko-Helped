import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, set, push, onValue, increment } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";
import * as main from "./main.js";

let mapGlobal;
function setUpFireBase() {

  const firebaseConfig = {
    apiKey: "AIzaSyBjV6DASL8Pm0gYowysgo_0OVBwrdPYBY0",
    authDomain: "project-3-ac709.firebaseapp.com",
    databaseURL: "https://project-3-ac709-default-rtdb.firebaseio.com",
    projectId: "project-3-ac709",
    storageBucket: "project-3-ac709.appspot.com",
    messagingSenderId: "280239623583",
    appId: "1:280239623583:web:302d8f5f925d9b4fa941aa"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  //getting our database
  const db = getDatabase();

  const favoritesDefaultRef = ref(db, 'highScores/');
  //console.log(app);
  //this is where we will handle all of the community loding
  if (window.location.href.match('index.html')) {
    //handle all the community loading in here making this script serve two purposes
    onValue(favoritesDefaultRef, updateNameAndScore);
  }

}
function writeScoreNameData(name, score, randomKey) {
  const db = getDatabase();
  const highScoreRef = ref(db, 'highScores/' + randomKey);
  set(highScoreRef, {
    name,
    score: score,
  });
};

function updateNameAndScore(snapshot) {
  let unsortedArrayName = [];
  let unsortedArrayScore = [];
  let map = new Map();
  let mapSorted = new Map;
  let indexer = 0;
  snapshot.forEach(score => {
    const childKey = score.key;
    const childData = score.val();
    //first likes
    unsortedArrayName.push(childData.name);
    //now ID
    unsortedArrayScore.push(childData.score);

  })
  for (let i = 0; i < unsortedArrayScore.length; i++) {
    //handle sorting here
    if (unsortedArrayScore[i] > unsortedArrayScore[i] - 1)
      //setting every single liked card into our map
      map.set( unsortedArrayName[i],unsortedArrayScore[i]);
  }
  /*
  const unsortedArray = [...map];
  const sortedArray = unsortedArray.sort(([value1, key1], [value2,key2]) =>
  unsortedArray.sort((a, b) => b[1] - a[1]))

  
  mapSorted = new Map(sortedArray);
  */
  //sort our map from greatest to least
 // mapSorted = ([...map.entries()].sort((a, b) => b[1] - a[1]));
  //mapSorted = ([...map.entries()].sort())
   mapSorted = ([...map.entries()].sort((a, b) => b[1] - a[1]));
  //console.log(mapSorted);
  mapGlobal = mapSorted;

}
function returnMapGlobal() {
  console.log(mapGlobal);
  return mapGlobal;

}
export { setUpFireBase, writeScoreNameData, returnMapGlobal }