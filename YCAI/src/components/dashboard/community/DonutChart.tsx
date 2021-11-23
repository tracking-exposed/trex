import { makeStyles } from '@material-ui/core';
import * as React from 'react';
import { YCAITheme } from 'theme';

interface Data {
  [key: string]: number[];
}

interface DonutChartProps<D extends Data> {
  id: string;
  title: string;
  data: D;
  colors: Record<keyof D, string>;
}

const useStyles = makeStyles<YCAITheme>((theme) => ({
  donutChart: {
    fontSize: theme.typography.h5.fontSize,
    color: theme.palette.primary.main,
    '& .c3-chart-arcs > .c3-chart-arcs-title': {
      fontFamily: theme.typography.h3.fontFamily,
      fontWeight: 600,
      fontSize: theme.typography.h3.fontSize,
      color: theme.palette.primary.main,
    },
  },
}));

export const DonutChart = <D extends Data>({
  id,
  title,
  data,
  colors,
}: DonutChartProps<D>): React.ReactElement => {
  const donutChardId = `donut-chart-${id}`;
  const classes = useStyles();

  React.useEffect(() => {
    const columns = Object.entries(data).reduce<any[]>((acc, [k, values]) => {
      return acc.concat([[k, ...values]]);
    }, []);

    const chartOpts = {
      bindto: `#${donutChardId}`,
      data: {
        columns: columns,
        type: 'donut',
        colors,
      },
      tooltip: {
        show: false,
      },
      legend: {
        show: false,
      },
      interaction: { enabled: false },
      donut: {
        title,
        label: {
          show: false,
        },
      },
    };

    const chart = c3.generate(chartOpts);

    return () => {
      chart.destroy();
    };
  }, []);

  return <div id={donutChardId} className={classes.donutChart} />;
};
