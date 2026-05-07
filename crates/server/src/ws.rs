use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use tokio::time::{interval, Duration};

use crate::state::AppState;

/// WebSocket upgrade handler for real-time opportunity feed.
pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    let mut tick = interval(Duration::from_secs(1));

    loop {
        tick.tick().await;

        let opportunities = state.opportunities.read().await;
        let payload = serde_json::json!({
            "type": "opportunities",
            "payload": *opportunities,
        });

        match socket.send(Message::Text(payload.to_string().into())).await {
            Ok(_) => {}
            Err(_) => break, // Client disconnected
        }
    }
}
