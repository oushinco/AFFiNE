import {
  InviteModal,
  type InviteModalProps,
  MemberLimitModal,
} from '@affine/component/member-components';
import {
  Pagination,
  type PaginationProps,
} from '@affine/component/member-components';
import { pushNotificationAtom } from '@affine/component/notification-center';
import { SettingRow } from '@affine/component/setting-components';
import { Avatar } from '@affine/component/ui/avatar';
import { Button, IconButton } from '@affine/component/ui/button';
import { Loading } from '@affine/component/ui/loading';
import { Menu, MenuItem } from '@affine/component/ui/menu';
import { Tooltip } from '@affine/component/ui/tooltip';
import { openSettingModalAtom } from '@affine/core/atoms';
import { AffineErrorBoundary } from '@affine/core/components/affine/affine-error-boundary';
import type { CheckedUser } from '@affine/core/hooks/affine/use-current-user';
import { useCurrentUser } from '@affine/core/hooks/affine/use-current-user';
import { useInviteMember } from '@affine/core/hooks/affine/use-invite-member';
import { useMemberCount } from '@affine/core/hooks/affine/use-member-count';
import { type Member, useMembers } from '@affine/core/hooks/affine/use-members';
import { useRevokeMemberPermission } from '@affine/core/hooks/affine/use-revoke-member-permission';
import { useWorkspaceQuota } from '@affine/core/hooks/use-quota';
import { useUserSubscription } from '@affine/core/hooks/use-subscription';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { Permission, SubscriptionPlan } from '@affine/graphql';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { ArrowRightBigIcon, MoreVerticalIcon } from '@blocksuite/icons';
import clsx from 'clsx';
import { useSetAtom } from 'jotai';
import type { ReactElement } from 'react';
import {
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import * as style from './style.css';
import type { WorkspaceSettingDetailProps } from './types';

const COUNT_PER_PAGE = 8;
export interface MembersPanelProps extends WorkspaceSettingDetailProps {
  upgradable: boolean;
}
type OnRevoke = (memberId: string) => void;
const MembersPanelLocal = () => {
  const t = useAFFiNEI18N();
  return (
    <Tooltip content={t['com.affine.settings.member-tooltip']()}>
      <div className={style.fakeWrapper}>
        <SettingRow name={`${t['Members']()} (0)`} desc={t['Members hint']()}>
          <Button size="large">{t['Invite Members']()}</Button>
        </SettingRow>
      </div>
    </Tooltip>
  );
};

export const CloudWorkspaceMembersPanel = ({
  isOwner,
  upgradable,
  workspaceMetadata,
}: MembersPanelProps) => {
  const workspaceId = workspaceMetadata.id;
  const memberCount = useMemberCount(workspaceId);

  const checkMemberCountLimit = useCallback(
    (memberCount: number, memberLimit?: number) => {
      if (memberLimit === undefined) return false;
      return memberCount >= memberLimit;
    },
    []
  );

  const quota = useWorkspaceQuota(workspaceId);
  const [subscription] = useUserSubscription();
  const plan = subscription?.plan ?? SubscriptionPlan.Free;
  const isLimited = checkMemberCountLimit(memberCount, quota?.memberLimit);

  const t = useAFFiNEI18N();
  const { invite, isMutating } = useInviteMember(workspaceId);
  const revokeMemberPermission = useRevokeMemberPermission(workspaceId);

  const [open, setOpen] = useState(false);
  const [memberSkip, setMemberSkip] = useState(0);

  const pushNotification = useSetAtom(pushNotificationAtom);

  const openModal = useCallback(() => {
    setOpen(true);
  }, []);

  const onPageChange = useCallback<PaginationProps['onPageChange']>(offset => {
    setMemberSkip(offset);
  }, []);

  const onInviteConfirm = useCallback<InviteModalProps['onConfirm']>(
    async ({ email, permission }) => {
      const success = await invite(
        email,
        permission,
        // send invite email
        true
      );
      if (success) {
        pushNotification({
          title: t['Invitation sent'](),
          message: t['Invitation sent hint'](),
          type: 'success',
        });
        setOpen(false);
      }
    },
    [invite, pushNotification, t]
  );

  const setSettingModalAtom = useSetAtom(openSettingModalAtom);
  const handleUpgradeConfirm = useCallback(() => {
    setSettingModalAtom({
      open: true,
      activeTab: 'plans',
    });
  }, [setSettingModalAtom]);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [memberListHeight, setMemberListHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (
      memberCount > COUNT_PER_PAGE &&
      listContainerRef.current &&
      memberListHeight === null
    ) {
      const rect = listContainerRef.current.getBoundingClientRect();
      setMemberListHeight(rect.height);
    }
  }, [listContainerRef, memberCount, memberListHeight]);

  const onRevoke = useCallback<OnRevoke>(
    async memberId => {
      const res = await revokeMemberPermission(memberId);
      if (res?.revoke) {
        pushNotification({
          title: t['Removed successfully'](),
          type: 'success',
        });
      }
    },
    [pushNotification, revokeMemberPermission, t]
  );

  const desc = useMemo(() => {
    if (!quota) return null;

    const humanReadable = quota.humanReadable;
    return (
      <span>
        {t['com.affine.payment.member.description']({
          planName: humanReadable.name,
          memberLimit: humanReadable.memberLimit,
        })}
        {upgradable ? (
          <>
            ,
            <div
              className={style.goUpgradeWrapper}
              onClick={handleUpgradeConfirm}
            >
              <span className={style.goUpgrade}>
                {t['com.affine.payment.member.description.go-upgrade']()}
              </span>
              <ArrowRightBigIcon className={style.arrowRight} />
            </div>
          </>
        ) : null}
      </span>
    );
  }, [handleUpgradeConfirm, quota, t, upgradable]);

  return (
    <>
      <SettingRow
        name={`${t['Members']()} (${memberCount})`}
        desc={desc}
        spreadCol={isOwner}
      >
        {isOwner ? (
          <>
            <Button onClick={openModal}>{t['Invite Members']()}</Button>
            {isLimited ? (
              <MemberLimitModal
                isFreePlan={plan === SubscriptionPlan.Free}
                open={open}
                plan={quota?.humanReadable.name ?? ''}
                quota={quota?.humanReadable.memberLimit ?? ''}
                setOpen={setOpen}
                onConfirm={handleUpgradeConfirm}
              />
            ) : (
              <InviteModal
                open={open}
                setOpen={setOpen}
                onConfirm={onInviteConfirm}
                isMutating={isMutating}
              />
            )}
          </>
        ) : null}
      </SettingRow>

      <div
        className={style.membersPanel}
        ref={listContainerRef}
        style={memberListHeight ? { height: memberListHeight } : {}}
      >
        <Suspense fallback={<MemberListFallback memberCount={memberCount} />}>
          <MemberList
            workspaceId={workspaceId}
            isOwner={isOwner}
            skip={memberSkip}
            onRevoke={onRevoke}
          />
        </Suspense>

        {memberCount > COUNT_PER_PAGE && (
          <Pagination
            totalCount={memberCount}
            countPerPage={COUNT_PER_PAGE}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </>
  );
};

const MemberListFallback = ({ memberCount }: { memberCount: number }) => {
  // prevent page jitter
  const height = useMemo(() => {
    if (memberCount > COUNT_PER_PAGE) {
      // height and margin-bottom
      return COUNT_PER_PAGE * 58 + (COUNT_PER_PAGE - 1) * 6;
    }
    return 'auto';
  }, [memberCount]);

  return (
    <div
      style={{
        height,
      }}
      className={style.membersFallback}
    >
      <Loading size={40} />
    </div>
  );
};

const MemberList = ({
  workspaceId,
  isOwner,
  skip,
  onRevoke,
}: {
  workspaceId: string;
  isOwner: boolean;
  skip: number;
  onRevoke: OnRevoke;
}) => {
  const members = useMembers(workspaceId, skip, COUNT_PER_PAGE);
  const currentUser = useCurrentUser();

  return (
    <div className={style.memberList}>
      {members.map(member => (
        <MemberItem
          key={member.id}
          member={member}
          isOwner={isOwner}
          currentUser={currentUser}
          onRevoke={onRevoke}
        />
      ))}
    </div>
  );
};

const MemberItem = ({
  member,
  isOwner,
  currentUser,
  onRevoke,
}: {
  member: Member;
  isOwner: boolean;
  currentUser: CheckedUser;
  onRevoke: OnRevoke;
}) => {
  const t = useAFFiNEI18N();

  const handleRevoke = useCallback(() => {
    onRevoke(member.id);
  }, [onRevoke, member.id]);

  const operationButtonInfo = useMemo(() => {
    return {
      show: isOwner && currentUser.id !== member.id,
      leaveOrRevokeText: t['Remove from workspace'](),
    };
  }, [currentUser.id, isOwner, member.id, t]);

  return (
    <div
      key={member.id}
      className={style.memberListItem}
      data-testid="member-item"
    >
      <Avatar
        size={36}
        url={member.avatarUrl}
        name={(member.emailVerified ? member.name : member.email) as string}
      />
      <div className={style.memberContainer}>
        {member.emailVerified ? (
          <>
            <div className={style.memberName}>{member.name}</div>
            <div className={style.memberEmail}>{member.email}</div>
          </>
        ) : (
          <div className={style.memberName}>{member.email}</div>
        )}
      </div>
      <div
        className={clsx(style.roleOrStatus, {
          pending: !member.accepted,
        })}
      >
        {member.accepted
          ? member.permission === Permission.Owner
            ? 'Workspace Owner'
            : 'Member'
          : 'Pending'}
      </div>
      <Menu
        items={
          <MenuItem data-member-id={member.id} onClick={handleRevoke}>
            {operationButtonInfo.leaveOrRevokeText}
          </MenuItem>
        }
      >
        <IconButton
          disabled={!operationButtonInfo.show}
          type="plain"
          style={{
            visibility: operationButtonInfo.show ? 'visible' : 'hidden',
            flexShrink: 0,
          }}
        >
          <MoreVerticalIcon />
        </IconButton>
      </Menu>
    </div>
  );
};

export const MembersPanel = (props: MembersPanelProps): ReactElement | null => {
  if (props.workspaceMetadata.flavour === WorkspaceFlavour.LOCAL) {
    return <MembersPanelLocal />;
  }
  return (
    <AffineErrorBoundary>
      <Suspense>
        <CloudWorkspaceMembersPanel {...props} />
      </Suspense>
    </AffineErrorBoundary>
  );
};
