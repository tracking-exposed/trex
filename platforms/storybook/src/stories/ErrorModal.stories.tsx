import { ComponentStory, ComponentMeta } from '@storybook/react';

import ErrorModal from '@shared/components/ErrorModal';

const Meta: ComponentMeta<typeof ErrorModal> = {
  title: 'Example/ErrorModal',
  component: ErrorModal,
  argTypes: { onClick: { action: 'modal dismissed' } },
};

export default Meta;

const Template: ComponentStory<typeof ErrorModal> = (args) => {
  return <ErrorModal {...args} />;
};

export const Basic = Template.bind({});
Basic.args = {
  name: 'Unknown Error',
  message: 'Something bad happened',
  details: [
    'POST https://rr3---sn-h5qzen76.googlevideo.com/videoplayback?expire=1666902354&ei=8ZRaY8vdNvbImLAPkaiC6A0&ip=88.21.58.21&id=o-ABcnkQsDUBSQQgKMB1OsEUhwys2hVmU5x_733sjfaHc0&itag=397&aitags=133%2C134%2C135%2C136%2C160%2C242%2C243%2C244%2C247%2C278%2C394%2C395%2C396%2C397%2C398&source=youtube&requiressl=yes&mh=GZ&mm=31%2C29&mn=sn-h5qzen76%2Csn-h5q7knez&ms=au%2Crdu&mv=m&mvi=3&pl=16&initcwndbps=1217500&spc=yR2vp5BV1znD6MgdEY8i-yo4caKvORAh4BqioTsSlvyp&vprv=1&mime=video%2Fmp4&ns=O6HTTZfWna0Z9L30c4o_zucI&gir=yes&clen=30000453&dur=468.768&lmt=1666828798895984&mt=1666880236&fvip=4&keepalive=yes&fexp=24001373%2C24007246&c=WEB&txp=5532434&n=CUIdajxDlCoNNQ&sparams=expire%2Cei%2Cip%2Cid%2Caitags%2Csource%2Crequiressl%2Cspc%2Cvprv%2Cmime%2Cns%2Cgir%2Cclen%2Cdur%2Clmt&sig=AOq0QJ8wRAIgfzo7NTS4QHjxumQwRE9aSuUqUs_bJ3RjbXAWEP_kMpQCIGh6bkFC-vpAEGADaSQGbjnY4GJFSzckXQEue2o-rIKB&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRgIhANz37FrCTJURkaX7LwWCozJTc-FQZMhN1I-vq6jruNlaAiEAvA2nJAxWERHAakQPLQqBIQmkAHRpCAzJdcOYK3xgMK4%3D&alr=yes&cpn=r8yrOa4r222ubWEO&cver=2.20221024.10.00&range=0-1775&rn=30&rbuf=0&pot=DwJSVfb4kf73AmpFcCo7h1a0-3-smo7mxm2UIDaTtR6G8XNwAsWLkU42_RAVq-jzmPn59VVdNhJSvuF5WmE8MFF3qBEQEWV0RMH9AJJot2fwTJmLwtxAIpgdz64= net::ERR_INTERNET_DISCONNECTED',
  ],
};
