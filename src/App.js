import { BrowserRouter, Route } from 'react-router-dom';
import Game from './Components/Game/Game';
import Homepage from './Components/Homepage/Homepage';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Route path="/" exact component={Homepage} />
        <Route path="/:id" exact component={Game} />
      </BrowserRouter>
    </div>
  );
}

export default App;
