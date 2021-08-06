import { BrowserRouter, Route } from 'react-router-dom';
import Game from './Components/Game/Game';
import Homepage from './Components/Homepage/Homepage';
import Singleplayer from './Components/Singleplayer/Singleplayer';
import Docs from './Components/Docs/Docs';

function App() {
  return (
    <BrowserRouter>
      <Route path="/" exact component={Homepage} />
      <Route path="/m/:id" exact component={Game} />
      <Route path="/s" exact component={Singleplayer} />
      <Route path="/docs" exact component={Docs} />
    </BrowserRouter>
  );
}

export default App;
