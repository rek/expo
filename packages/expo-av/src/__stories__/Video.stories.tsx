import * as React from 'react';

import VideoPlayer from './VideoPlayer';

export const HttpPlayer = () => (
  <VideoPlayer
    sources={[
      { uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
      { uri: 'http://techslides.com/demos/sample-videos/small.mp4' },
      { uri: 'http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8' },
    ]}
  />
);

// export const LocalAssetPlayer = () => (
//   <VideoPlayer
//     sources={[
//       { uri: 'http://techslides.com/demos/sample-videos/small.mp4' },
//       { uri: 'http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8' },
//     ]}
//   />
// );

export default {
  title: 'Video',
};
