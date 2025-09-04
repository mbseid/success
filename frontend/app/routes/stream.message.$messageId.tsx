import { eventStream } from "remix-utils";
import { createClient } from "graphql-ws";
import WebSocket from "ws";

const GRAPHQL_SUBSCRIPTION = `
  subscription MessageUpdates($messageId: String!) {
    messageUpdates(messageId: $messageId) {
      id
      content
      role
      createdAt
    }
  }
`;

export async function loader({ request, params }) {
  const { messageId } = params;
  
  if (!messageId) {
    throw new Response("Message ID required", { status: 400 });
  }

  return eventStream(request.signal, function setup(send) {
    console.log(`Starting stream for message ${messageId}`);
    
    // Create GraphQL WebSocket client
    const client = createClient({
      url: "ws://backend:8000/graphql",
      webSocketImpl: WebSocket
    });

    // Subscribe to message updates
    const subscription = client.iterate({
      query: GRAPHQL_SUBSCRIPTION,
      variables: { messageId },
    });

    // Process subscription updates
    (async () => {
      try {
        for await (const result of subscription) {
          if (result.data?.messageUpdates) {
            const message = result.data.messageUpdates;
            
            // Send the update as Server-Sent Event
            send({
              event: "message-update",
              data: JSON.stringify({
                id: message.id,
                content: message.content,
                role: message.role,
                createdAt: message.createdAt,
              }),
            });
          }
        }
      } catch (error) {
        console.error("Subscription error:", error);
        send({
          event: "error",
          data: JSON.stringify({ error: "Subscription failed" }),
        });
      } finally {
        // Clean up subscription
        subscription.return?.();
        client.dispose();
      }
    })();

    // Return cleanup function
    return function cleanup() {
      console.log(`Cleaning up stream for message ${messageId}`);
      subscription.return?.();
      client.dispose();
    };
  });
}