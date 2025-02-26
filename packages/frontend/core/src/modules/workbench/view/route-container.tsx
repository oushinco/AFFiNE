import { IconButton } from '@affine/component';
import { WindowsAppControls } from '@affine/core/components/pure/header/windows-app-controls';
import { RightSidebarIcon } from '@blocksuite/icons';
import { useLiveData } from '@toeverything/infra';
import { useService } from '@toeverything/infra/di';
import { useAtomValue } from 'jotai';
import { Suspense, useCallback } from 'react';

import { AffineErrorBoundary } from '../../../components/affine/affine-error-boundary';
import {
  appSidebarOpenAtom,
  SidebarSwitch,
} from '../../../components/app-sidebar';
import { RightSidebar } from '../../right-sidebar';
import * as styles from './route-container.css';
import { useView } from './use-view';
import { useViewPosition } from './use-view-position';

export interface Props {
  route: {
    Component: React.ComponentType;
  };
}

const ToggleButton = ({
  onToggle,
  className,
  show,
}: {
  onToggle?: () => void;
  className: string;
  show: boolean;
}) => {
  return (
    <IconButton
      size="large"
      onClick={onToggle}
      className={className}
      data-show={show}
    >
      <RightSidebarIcon />
    </IconButton>
  );
};

export const RouteContainer = ({ route }: Props) => {
  const view = useView();
  const viewPosition = useViewPosition();
  const leftSidebarOpen = useAtomValue(appSidebarOpenAtom);
  const rightSidebar = useService(RightSidebar);
  const rightSidebarOpen = useLiveData(rightSidebar.isOpen);
  const rightSidebarHasViews = useLiveData(rightSidebar.hasViews);
  const handleToggleRightSidebar = useCallback(() => {
    rightSidebar.toggle();
  }, [rightSidebar]);
  const isWindowsDesktop = environment.isDesktop && environment.isWindows;
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {viewPosition.isFirst && (
          <SidebarSwitch
            show={!leftSidebarOpen}
            className={styles.leftSidebarButton}
          />
        )}
        <view.header.Target className={styles.viewHeaderContainer} />
        {viewPosition.isLast && (
          <>
            {rightSidebarHasViews && (
              <ToggleButton
                show={!rightSidebarOpen}
                className={styles.rightSidebarButton}
                onToggle={handleToggleRightSidebar}
              />
            )}
            {isWindowsDesktop && (
              <div className={styles.windowsAppControlsContainer}>
                <WindowsAppControls />
              </div>
            )}
          </>
        )}
      </div>
      <view.body.Target className={styles.viewBodyContainer} />
      <AffineErrorBoundary>
        <Suspense>
          <route.Component />
        </Suspense>
      </AffineErrorBoundary>
    </div>
  );
};
