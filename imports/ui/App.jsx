import React from 'react';
import { Hello } from './Hello.jsx';
import { Info } from './Info.jsx';
import { App as KonstaApp, Page, Navbar, Block, Toggle, ListItem, List, Icon, Link } from 'konsta/react';
import { useDarkMode } from './hooks/useDarkMode.js';
import { MoonCircleFill, SunMax } from 'framework7-icons/react';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';

export const theme = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : 'material';

export function App() {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
  <KonstaApp theme={theme} safeAreas>
    <Page>
      <Navbar
        title="Welcome to Meteor"
        right={
          <Link iconOnly onClick={toggleDarkMode}>
            <Icon
              ios={ darkMode ? <SunMax className="w-6 h-6" /> : <MoonCircleFill className="w-6 h-6" />}
              material={ darkMode ? <MdOutlineLightMode className="w-6 h-6" /> : <MdOutlineDarkMode className="w-6 h-6" />}
            />
          </Link>
        }
      />
      <Hello/>
      <Info/>
    </Page>
  </KonstaApp>
);
}
