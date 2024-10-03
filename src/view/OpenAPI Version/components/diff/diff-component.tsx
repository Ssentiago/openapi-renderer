import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { RESOURCE_NAME } from '../../../typing/constants';
import { OpenAPIVersionView } from '../../openapi-version-view';
import { Specification } from '../../../../indexedDB/database/specification';
import HtmlFormatter, {
    hideUnchanged,
    showUnchanged,
} from 'jsondiffpatch/formatters/html';

// Styled components for titles
const Title = styled.h2`
    margin: 0;
    padding: 10px;
    color: var(--text-normal);
    background: var(--title-background);
    border-bottom: 1px solid #ddd;
`;
const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 15px;
    box-sizing: border-box;
`;
const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    height: calc(50% - 15px);
    margin-bottom: 15px;
`;
const Pane = styled.div`
    flex: 1;
    padding: 20px;
    overflow: auto;
`;
const LeftPane = styled(Pane)`
    border-right: 1px solid #ddd;
`;

const RightPane = styled(Pane)`
    padding-left: 20px;
`;

const BottomPane = styled.div`
    height: calc(50% - 15px);
    border-top: 1px solid #ddd;
    padding: 20px;
    overflow: auto;
`;

interface TwoPaneProps {
    leftSpec: Specification;
    rightSpec: Specification;
    view: OpenAPIVersionView;
}

const TwoPaneDiff: React.FC<TwoPaneProps> = ({ leftSpec, rightSpec, view }) => {
    const [diffHtml, setDiffHtml] = useState<string>('');
    const [showUnchangedDiff, setShowUnchangedDiff] = useState<boolean>(false);

    const leftPaneRef = useRef<HTMLDivElement | null>(null);
    const rightPaneRef = useRef<HTMLDivElement | null>(null);
    const diffContainerRef = useRef<HTMLDivElement | null>(null);

    const leftDiff = leftSpec.diff as string;
    const rightDiff = rightSpec.diff as string;
    const parsedLeft = JSON.parse(leftDiff);
    const parsedRight = JSON.parse(rightDiff);

    useEffect(() => {
        const handleDiff = async () => {
            const delta = view.controller.diffController.diff(
                parsedLeft,
                parsedRight
            );

            const formatter = new HtmlFormatter();
            const htmlDiff = formatter.format(delta, parsedLeft);
            if (!htmlDiff) {
                return;
            }

            const diffCSS = await view.plugin.resourceManager.getCSS(
                RESOURCE_NAME.DiffCSS
            );

            const combinedHTML = `
                <style>
                    ${diffCSS}
                </style>
                ${htmlDiff}
            `;

            setDiffHtml(combinedHTML);

            const handleScroll = (event: Event): void => {
                if (
                    event.target === leftPaneRef.current &&
                    rightPaneRef.current
                ) {
                    rightPaneRef.current.scrollTop =
                        leftPaneRef.current!.scrollTop;
                } else if (
                    event.target === rightPaneRef.current &&
                    leftPaneRef.current
                ) {
                    leftPaneRef.current.scrollTop =
                        rightPaneRef.current!.scrollTop;
                }
            };

            const leftPane = leftPaneRef.current;
            const rightPane = rightPaneRef.current;

            if (leftPane) {
                leftPane.addEventListener('scroll', handleScroll);
            }
            if (rightPane) {
                rightPane.addEventListener('scroll', handleScroll);
            }

            return (): void => {
                if (leftPane) {
                    leftPane.removeEventListener('scroll', handleScroll);
                }
                if (rightPane) {
                    rightPane.removeEventListener('scroll', handleScroll);
                }
            };
        };

        handleDiff();
    }, [leftSpec, rightSpec]);

    useEffect(() => {
        if (diffContainerRef.current) {
            if (showUnchangedDiff) {
                showUnchanged(true, diffContainerRef.current);
            } else {
                hideUnchanged(diffContainerRef.current);
            }
        }
    }, [showUnchangedDiff]);

    const leftContent = JSON.stringify(parsedLeft, null, 2);
    const rightContent = JSON.stringify(parsedRight, null, 2);

    return (
        <Container>
            <TopContainer>
                <LeftPane ref={leftPaneRef}>
                    <Title>{leftSpec.version}</Title>
                    <div>
                        <pre>{leftContent}</pre>
                    </div>
                </LeftPane>
                <RightPane ref={rightPaneRef}>
                    <Title>{rightSpec.version}</Title>
                    <div>
                        <pre>{rightContent}</pre>
                    </div>
                </RightPane>
            </TopContainer>
            <BottomPane>
                <Title>Diff</Title>
                <label>
                    <input
                        type="checkbox"
                        checked={showUnchangedDiff}
                        onChange={(e) => setShowUnchangedDiff(e.target.checked)}
                    />
                    Show Unchanged
                </label>
                <div
                    ref={diffContainerRef}
                    dangerouslySetInnerHTML={{ __html: diffHtml }}
                />
            </BottomPane>
        </Container>
    );
};

export default TwoPaneDiff;
