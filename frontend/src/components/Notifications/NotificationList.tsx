import React from 'react';
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from '../../store/api';

const NotificationList = ({ userId }: { userId: string }) => {
  const { data, error, isLoading } = useGetNotificationsQuery(userId);
  const [markRead] = useMarkNotificationReadMutation();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading notifications</div>;

  return (
    <ul>
      {data?.data?.map((n: any) => (
        <li key={n.id}>
          {n.message} - {n.read ? 'Read' : 'Unread'}
          {!n.read && <button onClick={() => markRead(n.id)}>Mark as read</button>}
        </li>
      ))}
    </ul>
  );
};

export default NotificationList;
