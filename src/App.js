import { BrowserRouter, Route } from 'react-router-dom';
import Game from './Components/Game/Game';
import Homepage from './Components/Homepage/Homepage';
import Singleplayer from './Components/Singleplayer/Singleplayer';

function App() {
  return (
    <BrowserRouter>
      <Route path="/" exact component={Homepage} />
      <Route path="/m/:id" exact component={Game} />
      <Route path="/s" exact component={Singleplayer} />
    </BrowserRouter>
  );
}

export default App;
