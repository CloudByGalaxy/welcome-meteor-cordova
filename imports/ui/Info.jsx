import React from "react";
import { useFind, useSubscribe } from "meteor/react-meteor-data";
import { LinksCollection } from "../api/links";
import { Block, BlockTitle, Icon, Link, List, ListItem, Preloader } from "konsta/react";
import { Link as LinkIcon } from "framework7-icons/react";
import { MdOutlineLink } from "react-icons/md";

const openUrl = (url) => {
  // @ts-ignore
  const cordova = window?.cordova;
  if (cordova?.InAppBrowser) {
    cordova.InAppBrowser.open(url, '_system');
  } else {
    window.open(url, '_blank');
  }
};

export const Info = () => {
  const isLoading = useSubscribe("links");
  const links = useFind(() => LinksCollection.find());

  if (isLoading()) {
    return (
      <Block strong inset className="text-center">
        <Preloader />
      </Block>
    );
  }

  return (
    <>
      <BlockTitle>Links</BlockTitle>
      <List strong inset>
        {links.map((link) => (
          <ListItem
            key={link._id}
            link
            title={link.title}
            linkProps={{
              onClick: () => openUrl(link.url),
            }}
            media={
              <Icon
                ios={<LinkIcon className="w-5 h-5" />}
                material={<MdOutlineLink className="w-5 h-5" />}
              />
            }
          />
        ))}
      </List>
    </>
  );
};
