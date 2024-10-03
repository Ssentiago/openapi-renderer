import { EventRef, Events } from 'obsidian';
import OpenAPIRendererPlugin from '../core/openapi-renderer-plugin';

import { eventID } from './typing/constants';
import { ObserverEventData, OpenAPIRendererEvent } from './typing/interfaces';

/**
 * Abstract class representing a Publisher.
 */
abstract class Publisher {
    constructor(public plugin: OpenAPIRendererPlugin) {}

    /**
     * Abstract method to publish an OpenAPI event.
     * @param event - The OpenAPIRendererEvent object to publish.
     * @typeparam T - The specific type of OpenAPIRendererEvent being published.
     */
    abstract publish<T extends OpenAPIRendererEvent>(
        event: OpenAPIRendererEvent
    ): void;
}

/**
 * Publisher for OpenAPI Renderer events.
 */
export class EventPublisher extends Publisher {
    constructor(plugin: OpenAPIRendererPlugin) {
        super(plugin);
    }

    /**
     * Publishes an OpenAPI Renderer event.
     * @param event - The OpenAPIRendererEvent object.
     */
    public publish(event: OpenAPIRendererEvent): void {
        event.emitter.trigger(event.eventID, event);
    }
}

/**
 * Abstract class representing an Observer.
 */
abstract class Observer {
    protected subscriptions: Set<ObserverEventData>;

    protected constructor(public plugin: OpenAPIRendererPlugin) {
        this.subscriptions = new Set();
    }

    /**
     * Abstract method to subscribe to an OpenAPI event.
     * @param emitter - The event emitter object.
     * @param eventID - The ID of the event to subscribe to.
     * @param handler - The asynchronous callback function to handle the event.
     * @typeparam T - The type of OpenAPIRendererEvent being subscribed to.
     */
    abstract subscribe<T extends OpenAPIRendererEvent>(
        emitter: Events,
        eventID: eventID,
        handler: (event: T) => Promise<void>
    ): void;

    /**
     * Abstract method to unsubscribe from an OpenAPI event.
     * @param emitter - The event emitter object.
     * @param eventRef - The reference or identifier of the event to unsubscribe from.
     */
    abstract unsubscribe(emitter: Events, eventRef: EventRef): void;
}

/**
 * Observer for handling OpenAPI Renderer events.
 */
export class EventObserver extends Observer {
    constructor(plugin: OpenAPIRendererPlugin) {
        super(plugin);
        this.subscribe(
            this.plugin.app.workspace,
            eventID.PowerOff,
            this.onunload.bind(this)
        );
    }

    /**
     * Asynchronous method called when unloading.
     * Unsubscribes from all events.
     */
    private async onunload(): Promise<void> {
        this.unsubscribeAll();
    }

    /**
     * Subscribes to an OpenAPI event.
     * @param emitter - The event emitter object.
     * @param eventID - The ID of the event to subscribe to.
     * @param handler - The asynchronous callback function to handle the event.
     * @typeparam T - The specific type of OpenAPIRendererEvent being subscribed to.
     */
    subscribe<T extends OpenAPIRendererEvent>(
        emitter: Events,
        eventID: eventID,
        handler: (event: T) => Promise<void>
    ): void {
        const eventRef = emitter.on(
            eventID,
            async (event: OpenAPIRendererEvent) => await handler(event as T)
        );

        this.subscriptions.add({
            emitter: emitter,
            eventRef: eventRef,
        } as ObserverEventData);
    }

    /**
     * Unsubscribes from an OpenAPI event.
     * @param emitter - The event emitter object.
     * @param eventRef - The reference or identifier of the event to unsubscribe from.
     */
    unsubscribe(emitter: Events, eventRef: EventRef): void {
        emitter.offref(eventRef);
    }

    /**
     * Unsubscribes from all subscribed events.
     * Clears all subscriptions.
     */
    unsubscribeAll(): void {
        this.subscriptions.forEach((subscription) => {
            this.unsubscribe(subscription.emitter, subscription.eventRef);
        });
        this.subscriptions.clear();
    }
}
